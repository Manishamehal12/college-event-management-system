const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['Academic','Cultural','Sports','Technical','Workshop','Seminar','Other'] },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  registeredCount: { type: Number, default: 0 },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizerName: { type: String },
  status: { type: String, enum: ['upcoming','ongoing','completed','cancelled'], default: 'upcoming' },
  tags: [String],
  registrationDeadline: { type: Date },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

eventSchema.virtual('isFull').get(function() {
  return this.registeredCount >= this.capacity;
});

eventSchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.capacity - this.registeredCount);
});

eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
