// src/controllers/agencyController.js
const { User, Agency, Car, Subscription } = require('../models');
const { Op } = require('sequelize');

// Get all agencies (admin only)
exports.getAllAgencies = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // First find all users with role 'agency'
    const agencyUsers = await User.findAll({
      where: { role: 'agency' },
      attributes: ['id']
    });

    // Then find all corresponding agencies
    const agencyIds = agencyUsers.map(user => user.id);
    const agencies = await Agency.findAll({
      where: { id: agencyIds },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'phoneNumber', 'role', 'createdAt']
        }
      ]
    });

    return res.status(200).json({ agencies });
  } catch (error) {
    console.error('Get all agencies error:', error);
    return res.status(500).json({ 
      message: 'Error fetching agencies',
      error: error.message
    });
  }
};


// Get agency by ID - Fixed
exports.getAgencyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Since Agency extends User, we need to make sure we're querying correctly
    // First, find the User with the specified ID
    const user = await User.findByPk(id);
    if (!user || user.role !== 'agency') {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Next, find the corresponding Agency
    const agency = await Agency.findByPk(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Get associated cars
    const cars = await Car.findAll({
      where: { agencyId: id },
      attributes: ['id', 'model', 'brand', 'year', 'price', 'status']
    });

    // Combine data - since Agency extends User, we need to merge properties
    const fullAgencyData = {
      // Agency properties
      id: agency.id,
      name: agency.name,
      address: agency.address,
      logo: agency.logo,
      isVerified: agency.isVerified,
      isActive: agency.isActive,
      status: agency.status,
      verificationDocs: agency.verificationDocs,
      // User properties
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      // Related data
      cars: cars
    };

    // If not admin and not the agency itself, return only public info
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      // Filter to only show publicly accessible fields
      const publicInfo = {
        id: agency.id,
        name: agency.name,
        logo: agency.logo,
        isVerified: agency.isVerified,
        isActive: agency.isActive,
        cars: cars.filter(car => car.status === 'available')
      };
      return res.status(200).json({ agency: publicInfo });
    }

    return res.status(200).json({ agency: fullAgencyData });
  } catch (error) {
    console.error('Get agency by ID error:', error);
    return res.status(500).json({ 
      message: 'Error fetching agency',
      error: error.message
    });
  }
};

// Updated getAllAgencies method
exports.getAllAgencies = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Find all users with role 'agency'
    const agencyUsers = await User.findAll({
      where: { role: 'agency' },
      attributes: ['id', 'email', 'phoneNumber', 'createdAt']
    });

    // Get the IDs of all agency users
    const agencyIds = agencyUsers.map(user => user.id);

    // Find all agencies with those IDs
    const agencies = await Agency.findAll({
      where: { id: agencyIds }
    });

    // Combine user and agency data
    const fullAgenciesData = agencies.map(agency => {
      const user = agencyUsers.find(u => u.id === agency.id);
      return {
        // Agency properties
        id: agency.id,
        name: agency.name,
        address: agency.address,
        logo: agency.logo,
        isVerified: agency.isVerified,
        isActive: agency.isActive,
        status: agency.status,
        // User properties
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      };
    });

    return res.status(200).json({ agencies: fullAgenciesData });
  } catch (error) {
    console.error('Get all agencies error:', error);
    return res.status(500).json({ 
      message: 'Error fetching agencies',
      error: error.message
    });
  }
};

// Update agency profile
exports.updateAgencyProfile = async (req, res) => {
  try {
    const agencyId = req.params.id;
    
    // Only allow agency to update its own profile or admin to update any agency
    if (req.user.role !== 'admin' && req.user.id !== agencyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, address, logo } = req.body;

    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Update fields
    await agency.update({
      name: name || agency.name,
      address: address || agency.address,
      logo: logo || agency.logo
    });

    return res.status(200).json({ 
      message: 'Agency profile updated successfully',
      agency: {
        id: agency.id,
        name: agency.name,
        address: agency.address,
        logo: agency.logo,
        isVerified: agency.isVerified,
        status: agency.status
      }
    });
  } catch (error) {
    console.error('Update agency error:', error);
    return res.status(500).json({ 
      message: 'Error updating agency profile',
      error: error.message
    });
  }
};

// Verify agency (admin only)
exports.verifyAgency = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { verified } = req.body;

    const agency = await Agency.findByPk(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Update verification status
    await agency.update({
      isVerified: verified === true,
      status: verified === true ? 'active' : 'pending'
    });

    return res.status(200).json({ 
      message: `Agency ${verified ? 'verified' : 'verification revoked'} successfully`,
      agency: {
        id: agency.id,
        name: agency.name,
        isVerified: agency.isVerified,
        status: agency.status
      }
    });
  } catch (error) {
    console.error('Verify agency error:', error);
    return res.status(500).json({ 
      message: 'Error verifying agency',
      error: error.message
    });
  }
};

// Toggle agency active status (admin only)
exports.toggleAgencyStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { active } = req.body;

    const agency = await Agency.findByPk(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Update active status
    await agency.update({
      isActive: active === true,
      status: active === true ? (agency.isVerified ? 'active' : 'pending') : 'inactive'
    });

    return res.status(200).json({ 
      message: `Agency ${active ? 'activated' : 'deactivated'} successfully`,
      agency: {
        id: agency.id,
        name: agency.name,
        isActive: agency.isActive,
        status: agency.status
      }
    });
  } catch (error) {
    console.error('Toggle agency status error:', error);
    return res.status(500).json({ 
      message: 'Error updating agency status',
      error: error.message
    });
  }
};

// Submit verification documents
exports.submitVerificationDocs = async (req, res) => {
  try {
    const agencyId = req.user.id;
    
    // Only allow agency to submit its own documents
    if (req.user.role !== 'agency') {
      return res.status(403).json({ message: 'Access denied. Agency only.' });
    }

    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // In a real app, you would process file uploads
    // For this example, we'll just store the document references
    await agency.update({
      verificationDocs: documents,
      status: 'pending_verification'
    });

    return res.status(200).json({ 
      message: 'Verification documents submitted successfully',
      agency: {
        id: agency.id,
        name: agency.name,
        status: agency.status,
        verificationDocs: agency.verificationDocs
      }
    });
  } catch (error) {
    console.error('Submit verification docs error:', error);
    return res.status(500).json({ 
      message: 'Error submitting verification documents',
      error: error.message
    });
  }
};

// Get agency subscription status
exports.getAgencySubscription = async (req, res) => {
  try {
    const agencyId = req.params.id;
    
    // Allow agency to check own subscription or admin to check any
    if (req.user.role !== 'admin' && req.user.id !== agencyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Get current active subscription
    const activeSubscription = await Subscription.findOne({
      where: {
        agencyId: agencyId,
        isActive: true,
        endDate: {
          [Op.gt]: new Date() // End date is in the future
        }
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan'
        }
      ]
    });

    if (!activeSubscription) {
      return res.status(200).json({ 
        hasActiveSubscription: false,
        message: 'No active subscription found'
      });
    }

    return res.status(200).json({ 
      hasActiveSubscription: true,
      subscription: activeSubscription
    });
  } catch (error) {
    console.error('Get agency subscription error:', error);
    return res.status(500).json({ 
      message: 'Error fetching agency subscription',
      error: error.message
    });
  }
};

// Get agency statistics (cars, reservations, etc.)
exports.getAgencyStatistics = async (req, res) => {
  try {
    const agencyId = req.params.id;
    
    // Allow agency to check own stats or admin to check any
    if (req.user.role !== 'admin' && req.user.id !== agencyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    // Get agency statistics
    const agencyStats = await AgencyStatistics.findOne({
      where: { id: agencyId }
    });

    if (!agencyStats) {
      return res.status(200).json({ 
        message: 'No statistics available yet'
      });
    }

    return res.status(200).json({ statistics: agencyStats });
  } catch (error) {
    console.error('Get agency statistics error:', error);
    return res.status(500).json({ 
      message: 'Error fetching agency statistics',
      error: error.message
    });
  }
};