const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Object} User object and token
 */
exports.registerUser = async (userData) => {
  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email });
  
  if (existingUser) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }
  
  // Create user
  const user = await User.create(userData);
  
  // Generate token
  const token = generateToken(user);
  
  return { user, token };
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User object and token
 */
exports.loginUser = async (email, password) => {
  // Check for user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  
  // Check if password matches
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  
  // Generate token
  const token = generateToken(user);
  
  return { user, token };
};

/**
 * Authenticate with Firebase
 * @param {string} idToken - Firebase ID token
 * @returns {Object} User object and token
 */
exports.firebaseAuth = async (idToken) => {
  // Verify Firebase token
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { uid, email, name } = decodedToken;
  
  // Check if user exists
  let user = await User.findOne({ firebaseUid: uid });
  
  if (!user && email) {
    // Create new user if not exists
    const names = name ? name.split(' ') : ['New', 'User'];
    const firstName = names[0];
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    
    user = await User.create({
      firebaseUid: uid,
      email,
      firstName,
      lastName,
      password: Math.random().toString(36).slice(-8), // Generate random password
      role: 'student' // Default role
    });
  }
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Generate token
  const token = generateToken(user);
  
  return { user, token };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error(`User not found with id of ${userId}`);
    error.statusCode = 404;
    throw error;
  }
  
  return user;
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};
