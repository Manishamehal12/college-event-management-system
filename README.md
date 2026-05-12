# 🎓 College Event Management System

A full-stack web application for managing college events, registrations, and attendance tracking — built with Node.js, Express, MongoDB, and vanilla JavaScript.

![CEM System](https://img.shields.io/badge/Status-Live-brightgreen) ![Node](https://img.shields.io/badge/Node.js-v25-green) ![MongoDB](https://img.shields.io/badge/MongoDB-v8-green) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📸 Preview

> Home Page — Dark Navy Design with Event Cards, QR Attendance, and Live Analytics Dashboard.

---

## ✨ Features

### 🎓 Students
- Browse and search all available events
- Filter events by category (Academic, Cultural, Sports, Technical, Workshop, Seminar)
- Register for events using name and email (no account required)
- Receive a **unique QR code** after registration
- Look up personal registrations by email

### 🎭 Organizers
- Create, edit, and delete events
- View registrations for each event
- Mark attendance using QR token
- Dashboard with event stats and charts

### 👑 Admin
- Manage all users (view, change roles, delete)
- View all events and registrations
- Generate system-wide analytics reports
- Monitor attendance rates

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens) |
| QR Code | qrcode npm package |
| Validation | express-validator |
| Password | bcryptjs |

---

## 📁 Folder Structure

```
college-event-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Global error handler
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Event.js              # Event schema
│   │   └── Registration.js       # Registration + QR schema
│   ├── routes/
│   │   ├── auth.js               # /api/auth/*
│   │   ├── events.js             # /api/events/*
│   │   ├── registrations.js      # /api/registrations/*
│   │   └── users.js              # /api/users/*
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Entry point
│
└── frontend/
    ├── css/
    │   └── style.css             # Full design system
    ├── js/
    │   ├── api.js                # API helper, Router, Toast, Modal
    │   ├── auth.js               # Login / Register / Logout
    │   ├── events.js             # Events listing & registration
    │   ├── dashboard.js          # Organizer/Admin dashboard
    │   └── users.js              # User management & reports
    └── index.html                # Single Page Application
```

---

## ⚙️ Prerequisites

Make sure these are installed:

- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (local) → https://www.mongodb.com/try/download/community

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Manishamehal12/college-event-management-system.git
cd college-event-management-system
```

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
Create a `.env` file inside the `backend/` folder:
```env
MONGO_URI=mongodb://localhost:27017/college_events
JWT_SECRET=your_secret_key_here
PORT=3000
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=Admin@123
NODE_ENV=development
```

### 4. Start the server
```bash
node server.js
```

You should see:
```
✅ MongoDB Connected: localhost
🎓 College Event Management System
🚀 Server running at http://localhost:3000
```

### 5. Seed the Admin account
Open your browser and visit:
```
http://localhost:3000/api/seed-admin
```

### 6. Open the app
```
http://localhost:3000
```

### 7. Login as Admin
- **Email:** admin@college.edu
- **Password:** Admin@123

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |

### Events
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events` | Get all events | Public |
| GET | `/api/events/:id` | Get single event | Public |
| POST | `/api/events` | Create event | Organizer/Admin |
| PUT | `/api/events/:id` | Update event | Organizer/Admin |
| DELETE | `/api/events/:id` | Delete event | Organizer/Admin |
| GET | `/api/events/stats` | Dashboard stats | Organizer/Admin |
| GET | `/api/events/:id/registrations` | Event registrations | Organizer/Admin |

### Registrations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/registrations` | Register for event | Public |
| GET | `/api/registrations/my?email=` | My registrations | Public |
| GET | `/api/registrations` | All registrations | Admin |
| POST | `/api/registrations/attendance` | Mark attendance | Organizer/Admin |
| DELETE | `/api/registrations/:id` | Cancel registration | Public |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Admin |
| PUT | `/api/users/:id` | Update user role | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/reports/summary` | Summary report | Admin |

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Student** | View events, register, view own registrations |
| **Organizer** | Student permissions + Create/Edit/Delete events, view registrations, mark attendance, dashboard |
| **Admin** | All permissions + Manage users, all registrations, analytics reports |

---

## 📱 Pages

| Page | Description |
|------|-------------|
| **Home** | Hero section, stats, features overview |
| **Events** | Browse, filter, search, register for events |
| **Dashboard** | Organizer/Admin stats, event management, attendance |
| **Users** | Admin user management with role control |
| **Reports** | Admin analytics, attendance rates, top events |

---

## 🔐 Security Features

- JWT authentication with 7-day expiry
- Passwords hashed with bcryptjs (12 rounds)
- Role-based access control (RBAC)
- Input validation with express-validator
- MongoDB injection protection via Mongoose

---

## 🌐 Deployment

To deploy to production:

1. Set `NODE_ENV=production` in `.env`
2. Use a strong random `JWT_SECRET`
3. Use **MongoDB Atlas** for the database
4. Deploy backend to **Railway**, **Render**, or **Heroku**
5. The backend serves the frontend automatically

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Manisha Mehal**
- GitHub: [@Manishamehal12](https://github.com/Manishamehal12)

---

⭐ If you found this project helpful, please give it a star!
