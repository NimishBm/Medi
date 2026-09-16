# ClinicFlow - Complete Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Setup MongoDB

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 free tier)
4. Go to "Database Access" → Create Database User
5. Go to "Network Access" → Add IP Address → Allow `0.0.0.0/0`
6. Click "Connect" → Copy connection string
7. Replace `<username>` and `<password>` with your credentials

**Option B: Local MongoDB**
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Linux
sudo systemctl start mongod
```

### 3. Setup Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit server/.env with your MongoDB URL
cat > server/.env << EOF
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/clinicflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
EOF

# Create client/.env.local
cat > client/.env.local << EOF
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
EOF
```

### 4. Seed Database

```bash
cd server
npm run seed
cd ..
```

**Output will show:**
```
PATIENT: rahul@example.com / Password123!
DOCTOR: dr.sarah@clinic.com / Password123!
RECEPTIONIST: receptionist@clinic.com / Password123!
```

### 5. Run Development Servers

```bash
# From project root
npm run dev
```

**The app will be available at:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Waiting Display: http://localhost:5173/display

---

## Detailed Setup Instructions

### Backend Setup

#### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

#### Steps

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cat > .env << EOF
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/clinicflow
   JWT_SECRET=your_secret_key
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   EOF
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server will start on http://localhost:5000

5. **Seed database** (in new terminal)
   ```bash
   npm run seed
   ```

### Frontend Setup

#### Prerequisites
- Node.js v18+
- npm or yarn

#### Steps

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env.local file**
   ```bash
   cat > .env.local << EOF
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   EOF
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will start on http://localhost:5173

---

## Project Structure

```
MediQueue/
├── server/
│   ├── src/
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Appointment.js
│   │   │   ├── Queue.js
│   │   │   ├── Consultation.js
│   │   │   ├── Prescription.js
│   │   │   ├── Payment.js
│   │   │   ├── Notification.js
│   │   │   └── QueuePause.js
│   │   ├── routes/           # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── doctors.js
│   │   │   ├── appointments.js
│   │   │   ├── queue.js
│   │   │   ├── consultations.js
│   │   │   ├── prescriptions.js
│   │   │   ├── payments.js
│   │   │   └── analytics.js
│   │   ├── middleware/       # Auth & validation
│   │   │   └── auth.js
│   │   ├── utils/            # Utilities
│   │   │   ├── errorHandler.js
│   │   │   └── catchAsyncErrors.js
│   │   ├── scripts/          # Database scripts
│   │   │   └── seed.js
│   │   └── index.js          # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── client/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Loading.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   ├── receptionist/
│   │   │   ├── WaitingRoomDisplay.jsx
│   │   │   └── Display/
│   │   ├── store/            # Redux state
│   │   │   ├── slices/
│   │   │   └── index.js
│   │   ├── services/         # API & Socket
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx           # Main App
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── Dockerfile
│
├── package.json              # Root workspace
├── docker-compose.yml        # Docker setup
├── .env.example              # Environment template
├── .gitignore               # Git ignore file
├── README.md                # Project documentation
├── SETUP.md                 # This file
└── DEPLOYMENT.md            # Deployment guide
```

---

## Available Scripts

### Root Level

```bash
# Start both frontend and backend
npm run dev

# Build frontend and backend
npm run build

# Start production server
npm run start
```

### Server

```bash
# Development with auto-reload
npm run dev

# Start production server
npm run start

# Build TypeScript
npm run build

# Seed database with demo data
npm run seed
```

### Client

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Database Models Reference

### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: PATIENT | DOCTOR | RECEPTIONIST,
  
  // Patient fields
  dateOfBirth: Date,
  gender: M | F | Other,
  medicalHistory: Array,
  allergies: Array,
  
  // Doctor fields
  specialization: String,
  consultationFee: Number,
  roomNumber: String,
  qualifications: Array,
  experience: Number,
  availability: {
    monday: { start, end },
    tuesday: { start, end },
    // ...
  },
  averageConsultationTime: Number,
  isActive: Boolean
}
```

### Appointment Model
```javascript
{
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  appointmentDate: Date,
  appointmentTime: String,
  status: BOOKED | CHECKED_IN | WAITING | CALLED | CONSULTING | COMPLETED | CANCELLED | SKIPPED | NO_SHOW,
  tokenNumber: Number,
  notes: String,
  reason: String,
  priority: Boolean,
  checkInTime: Date,
  calledTime: Date,
  consultationStartTime: Date,
  consultationEndTime: Date
}
```

### Queue Model
```javascript
{
  doctorId: ObjectId (ref: User),
  appointmentId: ObjectId (ref: Appointment),
  patientId: ObjectId (ref: User),
  tokenNumber: Number,
  queueDate: Date,
  status: WAITING | CALLED | CONSULTING | COMPLETED | SKIPPED | NO_SHOW,
  consultationDuration: Number,
  calledAt: Date,
  consultationStartAt: Date,
  consultationEndAt: Date
}
```

---

## API Endpoints Reference

### Authentication
```
POST   /api/auth/register        # Register new patient
POST   /api/auth/login           # Login
GET    /api/auth/me              # Get current user (protected)
```

### Doctors
```
GET    /api/doctors              # Get all doctors
GET    /api/doctors/:id          # Get doctor by ID
```

### Appointments
```
POST   /api/appointments                 # Create appointment
GET    /api/appointments                 # Get user appointments
GET    /api/appointments/today           # Get today's appointments
GET    /api/appointments/:id             # Get appointment by ID
PUT    /api/appointments/:id             # Update appointment
POST   /api/appointments/:id/cancel      # Cancel appointment
POST   /api/appointments/:id/check-in    # Check in patient
```

### Queue Management
```
GET    /api/queue/doctor/:doctorId           # Get queue
POST   /api/queue/call-next                  # Call next patient
POST   /api/queue/skip                       # Skip patient
POST   /api/queue/recall                     # Recall skipped
POST   /api/queue/start-consultation         # Start consultation
POST   /api/queue/complete-consultation      # Complete consultation
POST   /api/queue/no-show                    # Mark no-show
```

### Consultations
```
POST   /api/consultations                    # Create
GET    /api/consultations/patient/:patientId # Get patient consultations
GET    /api/consultations/:id                # Get by ID
PUT    /api/consultations/:id                # Update
```

### Prescriptions
```
POST   /api/prescriptions                    # Create
GET    /api/prescriptions/patient/:patientId # Get patient prescriptions
GET    /api/prescriptions/:id                # Get by ID
```

### Payments
```
POST   /api/payments                     # Create payment
GET    /api/payments/patient/:patientId  # Get patient payments
GET    /api/payments/:id                 # Get by ID
POST   /api/payments/:id/refund          # Refund
```

### Analytics
```
GET    /api/analytics/today              # Today's stats
GET    /api/analytics/doctor/:doctorId   # Doctor's stats
GET    /api/analytics/clinic/overview    # Clinic overview
```

---

## Real-Time Features (Socket.IO)

The application uses Socket.IO for real-time queue updates.

### Socket Events

**Client emits:**
```javascript
socket.emit('join-queue', { doctorId })   // Join queue room
socket.emit('leave-queue', { doctorId })  // Leave queue room
```

**Server broadcasts:**
```javascript
socket.emit('queue-update', data)  // Queue changed
```

### How It Works

1. Patient joins queue monitoring room when viewing live queue
2. When doctor calls next patient, `queue-update` is broadcast
3. All clients in that doctor's queue room receive update
4. Frontend updates display immediately without refresh
5. Waiting time is recalculated based on current queue

---

## Demo Accounts

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Patient | rahul@example.com | Password123! |
| Doctor | dr.sarah@clinic.com | Password123! |
| Receptionist | receptionist@clinic.com | Password123! |

---

## Troubleshooting

### Issue: "Cannot find module 'mongoose'"
**Solution:**
```bash
cd server
npm install
cd ..
```

### Issue: "Port 5000 already in use"
**Solution (macOS/Linux):**
```bash
lsof -ti:5000 | xargs kill -9
```

**Solution (Windows):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: MongoDB connection failed
**Solution:**
1. Verify MongoDB is running
2. Check connection string in `.env`
3. Ensure network access is allowed in Atlas
4. Verify credentials are correct

### Issue: "CORS error" or "Socket connection failed"
**Solution:**
1. Check `CLIENT_URL` in server `.env`
2. Check `VITE_API_URL` in client `.env.local`
3. Ensure both server and client are running
4. Clear browser cache

### Issue: "Token is not valid"
**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Logout and login again
3. Check JWT_SECRET in server `.env`

---

## Performance Tips

1. **Database Queries**: Indexed fields:
   - `User.email`
   - `Appointment.patientId`, `doctorId`, `appointmentDate`
   - `Queue.doctorId`, `queueDate`, `status`
   - `Consultation.patientId`, `createdAt`

2. **Frontend Optimization**:
   - Redux caching for frequently accessed data
   - Lazy loading of routes
   - Debounced API calls
   - Memoized components

3. **Backend Optimization**:
   - Connection pooling in MongoDB
   - Query optimization with lean()
   - Pagination for large datasets
   - Socket.IO namespaces for queue rooms

---

## Next Steps

1. **Customize Branding**: Update colors in `tailwind.config.js`
2. **Add More Doctors**: Use seed script as template
3. **Setup Email Notifications**: Integrate with email service
4. **Deploy to Production**: See DEPLOYMENT.md
5. **Enable HTTPS**: Use SSL certificates in production

---

## Support & Resources

- **Documentation**: See README.md
- **Deployment**: See DEPLOYMENT.md
- **Issues**: Create issue with details and error logs
- **API Docs**: Full API documentation in README.md
- **Database Schema**: See models/ directory

Happy coding! 🚀
