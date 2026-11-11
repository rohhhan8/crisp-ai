const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Private/Admin
router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const candidates = await User.find({ role: 'CANDIDATE' }).select('-password');
  res.json(candidates);
}));

module.exports = router;
