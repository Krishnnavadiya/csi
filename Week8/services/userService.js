const User = require('../models/User');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
  async getAllUsers() {
    logger.info('Fetching all users');
    return await User.find().select('-password');
  }

  async getUserById(id) {
    logger.info(`Fetching user with id: ${id}`);
    const user = await User.findById(id).select('-password');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async createUser(userData) {
    logger.info('Creating new user');
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    // Create user
    return await User.create(userData);
  }

  async updateUser(id, userData) {
    logger.info(`Updating user with id: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // If password is being updated, hash it
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(id, userData, {
      new: true,
      runValidators: true
    }).select('-password');

    return updatedUser;
  }

  async deleteUser(id) {
    logger.info(`Deleting user with id: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await user.deleteOne();
    return { success: true };
  }

  // Authentication methods
  async register(userData) {
    logger.info('Registering new user');
    return await this.createUser(userData);
  }

  async login(email, password) {
    logger.info(`Login attempt for email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = this.generateToken(user._id, user.role);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }
}

module.exports = new UserService();