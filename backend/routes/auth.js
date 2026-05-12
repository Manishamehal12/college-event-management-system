const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    const { name, email, password, role, department, studentId, phone } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });
      const user = await User.create({ name, email, password, role: role || 'student', department, studentId, phone });
      const token = generateToken(user._id);
      res.status(201).json({ success: true, message: 'Account created successfully', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const token = generateToken(user._id);
      res.json({ success: true, message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  const { name, department, studentId, phone } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name, department, studentId, phone }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
