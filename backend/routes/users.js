const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, count: users.length, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role, isActive }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalRegistrations, attended] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Registration.countDocuments({ attended: true }),
    ]);
    const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const topEvents = await Registration.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $project: { title: '$event.title', count: 1, category: '$event.category' } },
    ]);
    res.json({ success: true, report: { totalUsers, totalEvents, totalRegistrations, attended, attendanceRate: totalRegistrations > 0 ? Math.round((attended / totalRegistrations) * 100) : 0, usersByRole, topEvents } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
