const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 12 } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { venue: { $regex: search, $options: 'i' } }];
    const total = await Event.countDocuments(query);
    const events = await Event.find(query).populate('organizer', 'name email').sort({ date: 1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, count: events.length, total, pages: Math.ceil(total / limit), currentPage: Number(page), events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const query = req.user.role === 'organizer' ? { organizer: req.user._id } : {};
    const [totalEvents, upcomingEvents, completedEvents] = await Promise.all([
      Event.countDocuments(query),
      Event.countDocuments({ ...query, status: 'upcoming' }),
      Event.countDocuments({ ...query, status: 'completed' }),
    ]);
    const eventIds = await Event.find(query).distinct('_id');
    const totalRegistrations = await Registration.countDocuments(req.user.role === 'organizer' ? { event: { $in: eventIds } } : {});
    const categoryStats = await Event.aggregate([{ $match: query }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Registration.aggregate([{ $match: { createdAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]);
    res.json({ success: true, stats: { totalEvents, upcomingEvents, completedEvents, totalRegistrations, categoryStats, monthlyTrend } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('organizer', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('venue').trim().notEmpty().withMessage('Venue is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    try {
      const event = await Event.create({ ...req.body, organizer: req.user._id, organizerName: req.user.name });
      res.status(201).json({ success: true, message: 'Event created successfully', event });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.put('/:id', protect, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    await Registration.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/registrations', protect, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id }).sort({ createdAt: -1 });
    const attended = registrations.filter(r => r.attended).length;
    res.json({ success: true, count: registrations.length, attended, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
