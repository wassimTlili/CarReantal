// controllers/agencyStatisticsController.js
const { AgencyStatistics, Reservation, Car } = require('../models');

exports.generateReport = async (req, res) => {
  try {
    const { agencyId } = req.params;
    
    // Fetch necessary data
    const totalCars = await Car.count({ where: { agencyId } });
    const availableCars = await Car.count({ where: { agencyId, status: 'available' } });
    const reservedCars = await Car.count({ where: { agencyId, status: 'reserved' } });
    const totalReservations = await Reservation.count({ 
      include: [{ 
        model: Car, 
        where: { agencyId } 
      }] 
    });
    const completedReservations = await Reservation.count({ 
      where: { status: 'completed' },
      include: [{ 
        model: Car, 
        where: { agencyId } 
      }] 
    });
    const canceledReservations = await Reservation.count({ 
      where: { status: 'cancelled' },
      include: [{ 
        model: Car, 
        where: { agencyId } 
      }] 
    });
    
    // Update or create statistics
    const [stats, created] = await AgencyStatistics.findOrCreate({
      where: { agencyId },
      defaults: {
        totalCars,
        availableCars,
        reservedCars,
        totalReservations,
        completedReservations,
        canceledReservations,
        lastUpdated: new Date()
      }
    });
    
    if (!created) {
      await stats.update({
        totalCars,
        availableCars,
        reservedCars,
        totalReservations,
        completedReservations,
        canceledReservations,
        lastUpdated: new Date()
      });
    }
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating agency statistics report:', error);
    return res.status(500).json({ message: 'Failed to generate statistics report' });
  }
};

exports.calculatePerformanceMetrics = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { startDate, endDate } = req.query;
    
    const stats = await AgencyStatistics.findOne({ where: { agencyId } });
    if (!stats) {
      return res.status(404).json({ message: 'Agency statistics not found' });
    }
    
    // Calculate custom performance metrics
    // This would involve complex calculations based on your business logic
    const performanceData = {
      occupancyRate: (stats.reservedCars / stats.totalCars * 100).toFixed(2),
      cancellationRate: (stats.canceledReservations / stats.totalReservations * 100).toFixed(2),
      revenueGrowth: 0, // Would need historical data for this
      period: { startDate, endDate }
    };
    
    return res.status(200).json(performanceData);
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return res.status(500).json({ message: 'Failed to calculate performance metrics' });
  }
};