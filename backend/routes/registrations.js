const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

router.post('/',
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    const { eventId, name, email, phone, department, studentId } = req.body;
    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      if (event.status === 'cancelled') return res.status(400).json({ success: false, message: 'Event has been cancelled' });
      if (event.registeredCount >= event.capacity) return res.status(400).json({ success: false, message: 'Event is at full capacity' });
      if (event.registrationDeadline && new Date() > event.registrationDeadline) return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
      const existingReg = await Registration.findOne({ event: eventId, email });
      if (existingReg) return res.status(400).json({ success: false, message: 'You are already registered for this event' });
      const qrToken = crypto.randomBytes(32).toString('hex');
      const qrData = JSON.stringify({ token: qrToken, event: eventId, email });
      const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
      const registration = await Registration.create({ event: eventId, name, email, phone, department, studentId, qrToken, qrCode });
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
      res.status(201).json({ success: true, message: 'Registration successful!', registration: { registrationNumber: registration.registrationNumber, name: registration.name, email: registration.email, event: event.title, date: event.date, venue: event.venue, qrCode: registration.qrCode } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get('/my', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  try {
    const registrations = await Registration.find({ email }).populate('event', 'title date venue status category time').sort({ createdAt: -1 });
    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, eventId } = req.query;
    const query = eventId ? { event: eventId } : {};
    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query).populate('event', 'title date category venue').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, count: registrations.length, total, pages: Math.ceil(total / limit), registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/attendance', protect, authorize('organizer', 'admin'), async (req, res) => {
  const { qrToken } = req.body;
  if (!qrToken) return res.status(400).json({ success: false, message: 'QR token is required' });
  try {
    const registration = await Registration.findOne({ qrToken }).populate('event', 'title date');
    if (!registration) return res.status(404).json({ success: false, message: 'Invalid QR code' });
    if (registration.attended) return res.status(400).json({ success: false, message: 'Attendance already marked', registration });
    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();
    res.json({ success: true, message: `Attendance marked for ${registration.name}`, registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { email } = req.body;
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.email !== email) return res.status(403).json({ success: false, message: 'Not authorized' });
    await Registration.findByIdAndDelete(req.params.id);
    await Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: -1 } });
    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
