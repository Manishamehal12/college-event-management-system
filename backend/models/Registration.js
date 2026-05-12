const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  department: { type: String, trim: true },
  studentId: { type: String, trim: true },
  qrCode: { type: String },
  qrToken: { type: String, unique: true },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date },
  status: { type: String, enum: ['confirmed','cancelled','waitlisted'], default: 'confirmed' },
  registrationNumber: { type: String, unique: true },
}, { timestamps: true });

registrationSchema.pre('save', async function(next) {
  if (!this.registrationNumber) {
    const count = await mongoose.model('Registration').countDocuments();
    this.registrationNumber = `REG-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Registration', registrationSchema);
