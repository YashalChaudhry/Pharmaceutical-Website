const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    // Log the complete request details
    console.log('=== Registration Request Details ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('================================');

    const { name, email, password } = req.body;
    
    // Log parsed data
    console.log('Parsed registration data:', {
      hasName: !!name,
      hasEmail: !!email,
      hasPassword: !!password,
      nameLength: name?.length,
      emailLength: email?.length,
      passwordLength: password?.length
    });

    // Validate input with specific messages
    if (!name) {
      console.log('Registration failed: Name is missing');
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
      console.log('Registration failed: Email is missing');
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      console.log('Registration failed: Password is missing');
      return res.status(400).json({ message: 'Password is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Registration failed: Invalid email format:', email);
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Registration failed: Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('Registration failed: User already exists with email:', email);
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });
    
    console.log('Attempting to save new user:', { name, email });
    
    // Save user to database
    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser._id);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    console.log('Registration successful for user:', email);
    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('=== Registration Error Details ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('===============================');
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'This email is already registered',
        details: 'Duplicate email address'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid input data',
        details: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    res.status(500).json({ 
      message: 'Registration failed',
      details: error.message || 'An unexpected error occurred'
    });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user._id;
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
