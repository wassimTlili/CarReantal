// controllers/platformStatisticsController.js
const { PlatformStatistics, Agency, Car, Reservation } = require('../models');

exports.generateReport = async (req, res) => {
  try {
    // Fetch platform-wide statistics
    const totalAgencies = await Agency.count();
    const activeAgencies = await Agency.count({ where: { isActive: true } });
    const totalCars = await Car.count();
    const totalReservations = await Reservation.count();
    
    // Create or update platform statistics
    const [stats, created] = await PlatformStatistics.findOrCreate({
      where: { period: new Date().toISOString().split('T')[0] },
      defaults: {
        totalAgencies,
        activeAgencies,
        totalCars,
        totalReservations,
        period: new Date()
      }
    });
    
    if (!created) {
      await stats.update({
        totalAgencies,
        activeAgencies,
        totalCars,
        totalReservations,
        period: new Date()
      });
    }
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating platform statistics report:', error);
    return res.status(500).json({ message: 'Failed to generate platform statistics' });
  }
};

exports.updateStats = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const stats = await PlatformStatistics.findByPk(id);
    if (!stats) {
      return res.status(404).json({ message: 'Platform statistics not found' });
    }
    
    await stats.update(updates);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error updating platform statistics:', error);
    return res.status(500).json({ message: 'Failed to update platform statistics' });
  }
};

exports.calculateGrowth = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Get current stats
    const currentStats = await PlatformStatistics.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    // Get previous stats for comparison
    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 1);
    
    const previousStats = await PlatformStatistics.findOne({
      where: {
        createdAt: {
          [Op.lt]: currentStats.createdAt,
          [Op.gt]: previousDate
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!previousStats) {
      return res.status(200).json({ message: 'Not enough historical data for growth calculation' });
    }
    
    // Calculate growth percentages
    const growth = {
      agencyGrowth: ((currentStats.totalAgencies - previousStats.totalAgencies) / previousStats.totalAgencies * 100).toFixed(2),
      carGrowth: ((currentStats.totalCars - previousStats.totalCars) / previousStats.totalCars * 100).toFixed(2),
      reservationGrowth: ((currentStats.totalReservations - previousStats.totalReservations) / previousStats.totalReservations * 100).toFixed(2),
      period: period || 'monthly'
    };
    
    return res.status(200).json(growth);
  } catch (error) {
    console.error('Error calculating platform growth:', error);
    return res.status(500).json({ message: 'Failed to calculate growth metrics' });
  }
};