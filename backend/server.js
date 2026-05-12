require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const userRoutes = require('./routes/users');

connectDB();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running 🎓' });
});

app.get('/api/seed-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) return res.json({ success: false, message: 'Admin already exists' });
    await User.create({
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@college.edu',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });
    res.json({ success: true, message: 'Admin created! Email: admin@college.edu | Password: Admin@123' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n🎓 College Event Management System');
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔑 Seed admin at http://localhost:${PORT}/api/seed-admin\n`);
});
