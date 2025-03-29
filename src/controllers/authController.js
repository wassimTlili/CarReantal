// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Admin, Agency, Customer } = require('../models');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// User registration
exports.register = async (req, res) => {
  try {
    const { email, password, phoneNumber, role, firstName, lastName, address, username, name, logo } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user based on role
    let user;
    let userData = { email, password, phoneNumber, role };

    // Use a transaction to ensure consistency
    const transaction = await User.sequelize.transaction();

    try {
      // First create the base User
      user = await User.create(userData, { transaction });

      // Then create the specific role model with the same ID
      switch (role) {
        case 'admin':
          if (!username) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Username is required for admin registration' });
          }
          await Admin.create({
            id: user.id, // This is the critical part
            username
          }, { transaction });
          break;
        
        case 'agency':
          if (!name) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Agency name is required' });
          }
          await Agency.create({
            id: user.id, // This is the critical part
            name,
            address,
            logo,
            status: 'pending',
            isVerified: false,
            isActive: true
          }, { transaction });
          break;
        
        case 'customer':
          if (!firstName || !lastName) {
            await transaction.rollback();
            return res.status(400).json({ message: 'First name and last name are required' });
          }
          await Customer.create({
            id: user.id, // This is the critical part
            firstName,
            lastName,
            address
          }, { transaction });
          break;
        
        default:
          await transaction.rollback();
          return res.status(400).json({ message: 'Invalid role specified' });
      }

      // Commit the transaction
      await transaction.commit();

      // Generate token
      const token = generateToken(user);

      // Return user info and token
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      // If any error occurs, rollback the transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Error registering user',
      error: error.message
    });
  }
};

// User login
// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get user details based on role
    let userDetails;
    switch (user.role) {
      case 'admin':
        userDetails = await Admin.findByPk(user.id);
        break;
      case 'agency':
        // Check if agency is active
        const agency = await Agency.findByPk(user.id);
        if (!agency.isActive) {
          return res.status(403).json({ message: 'Your agency account has been deactivated' });
        }
        userDetails = agency;
        break;
      case 'customer':
        userDetails = await Customer.findByPk(user.id);
        break;
      default:
        userDetails = user;
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...(userDetails ? userDetails.get({ plain: true }) : {})
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Error during login',
      error: error.message
    });
  }
};

// Get current user profile
// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let userDetails;
    switch (role) {
      case 'admin':
        userDetails = await Admin.findByPk(userId);
        break;
      case 'agency':
        userDetails = await Agency.findByPk(userId);
        break;
      case 'customer':
        userDetails = await Customer.findByPk(userId);
        break;
      default:
        userDetails = await User.findByPk(userId);
    }

    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the plain object and remove the password
    const userObject = userDetails.get({ plain: true });
    delete userObject.password;

    return res.status(200).json({
      user: userObject
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ password: hashedPassword });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ 
      message: 'Error updating password',
      error: error.message
    });
  }
};

// Reset password request
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return success even if user doesn't exist for security reasons
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Save it to the user record with an expiry
    // 3. Send an email with a reset link
    
    // For demo purposes:
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_RESET_SECRET || 'reset-secret-key',
      { expiresIn: '1h' }
    );

    // Here you would send an email with the reset token
    console.log(`Reset token for ${email}: ${resetToken}`);

    return res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link',
      // Only include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ 
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};