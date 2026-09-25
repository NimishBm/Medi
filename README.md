# MediQ - Clinic Management & Smart Patient Queue System

A complete, production-ready full-stack clinic management system with real-time queue updates, appointment booking, and role-based dashboards for patients, doctors, and receptionists.

## Features

### Patient Dashboard
- ✅ Dashboard with next appointment & queue status
- ✅ Book appointments with doctors
- ✅ Real-time live queue tracking
- ✅ View medical prescriptions
- ✅ Appointment history
- ✅ Payment/billing information

### Doctor Dashboard
- ✅ Today's appointments overview
- ✅ Real-time queue management
- ✅ Call next patient
- ✅ Start/complete consultations
- ✅ Patient history
- ✅ Create prescriptions
- ✅ Add diagnoses and notes

### Receptionist Dashboard
- ✅ Clinic operations overview
- ✅ Manage appointments
- ✅ Patient check-in
- ✅ Queue management
- ✅ Patient registration
- ✅ Payment recording
- ✅ Clinic analytics

### Real-Time Features
- ✅ Socket.IO integration for live queue updates
- ✅ Instant notification when patient is called
- ✅ Dynamic waiting time calculation
- ✅ Public waiting room display for clinic TV

### Additional Features
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ MongoDB Atlas integration
- ✅ Responsive design
- ✅ Modern UI inspired by SaaS applications

## Technology Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time client
- **Recharts** - Charts
- **react-hot-toast** - Notifications

## Project Structure

```
MediQueue/
├── server/
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   ├── utils/         # Utilities
│   │   ├── scripts/       # Seed data
│   │   └── index.js       # Main server file
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux slices
│   │   ├── services/      # API & Socket
│   │   └── App.jsx        # Main App
│   ├── package.json
│   └── vite.config.js
├── package.json           # Root workspace
└── .env.example          # Environment template
```

## Setup Instructions

### Prerequisites
- Node.js v18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git

### Step 1: Clone & Install Dependencies

```bash
cd MediQueue
npm install

cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Step 2: Setup Environment Variables

```bash
# Create server .env file
cp .env.example .env

# Copy to server directory
cp .env server/.env
```

Edit `server/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/MediQ?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=development
```

Create `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Go to Database Access and create a user
4. Go to Network Access and allow `0.0.0.0/0` (for development)
5. Get your connection string from "Connect" button
6. Update `MONGO_URI` in `.env`

### Step 4: Seed Database

```bash
cd server
npm run seed
cd ..
```

Output will show demo accounts:
```
PATIENT: rahul@example.com / Password123!
DOCTOR: dr.sarah@clinic.com / Password123!
RECEPTIONIST: receptionist@clinic.com / Password123!
```

### Step 5: Run Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

## API Documentation

### Authentication
```
POST   /api/auth/register    - Register new patient
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user (protected)
```

### Doctors
```
GET    /api/doctors          - Get all doctors
GET    /api/doctors/:id      - Get doctor by ID
```

### Appointments
```
POST   /api/appointments           - Create appointment
GET    /api/appointments           - Get user's appointments
GET    /api/appointments/today     - Get today's appointments
GET    /api/appointments/:id       - Get appointment by ID
PUT    /api/appointments/:id       - Update appointment
POST   /api/appointments/:id/cancel       - Cancel appointment
POST   /api/appointments/:id/check-in    - Check in patient
```

### Queue
```
GET    /api/queue/doctor/:doctorId  - Get queue for doctor
POST   /api/queue/call-next          - Call next patient
POST   /api/queue/skip               - Skip patient
POST   /api/queue/recall             - Recall skipped patient
POST   /api/queue/start-consultation - Start consultation
POST   /api/queue/complete-consultation - Complete consultation
POST   /api/queue/no-show            - Mark as no-show
```

### Consultations
```
POST   /api/consultations              - Create consultation
GET    /api/consultations/patient/:patientId - Get consultations
GET    /api/consultations/:id          - Get consultation by ID
```

### Prescriptions
```
POST   /api/prescriptions                  - Create prescription
GET    /api/prescriptions/patient/:patientId - Get prescriptions
GET    /api/prescriptions/:id             - Get prescription by ID
```

### Payments
```
POST   /api/payments                  - Record payment
GET    /api/payments/patient/:patientId - Get payments
GET    /api/payments/:id             - Get payment by ID
POST   /api/payments/:id/refund      - Refund payment
```

### Analytics
```
GET    /api/analytics/today          - Today's stats
GET    /api/analytics/doctor/:doctorId - Doctor's stats
GET    /api/analytics/clinic/overview - Clinic overview
```

## Database Models

### User
```javascript
{
  name, email, phone, password, role (PATIENT|DOCTOR|RECEPTIONIST),
  // Patient fields
  dateOfBirth, gender, medicalHistory, allergies,
  // Doctor fields
  specialization, consultationFee, roomNumber, qualifications,
  experience, availability, averageConsultationTime
}
```

### Appointment
```javascript
{
  patientId, doctorId, appointmentDate, appointmentTime,
  status (BOOKED|CHECKED_IN|WAITING|CALLED|CONSULTING|COMPLETED|CANCELLED|SKIPPED|NO_SHOW),
  tokenNumber, notes, reason, priority, runningLate
}
```

### Queue
```javascript
{
  doctorId, appointmentId, patientId, tokenNumber, queueDate,
  status (WAITING|CALLED|CONSULTING|COMPLETED|SKIPPED|NO_SHOW),
  consultationDuration
}
```

### Consultation
```javascript
{
  appointmentId, patientId, doctorId,
  symptoms, diagnosis, notes, treatmentPlan, followUpDate
}
```

### Prescription
```javascript
{
  consultationId, patientId, doctorId,
  medicines: [{ name, dosage, frequency, duration, instructions }],
  additionalNotes, validTill
}
```

### Payment
```javascript
{
  appointmentId, patientId, doctorId,
  consultationFee, additionalCharges, totalAmount,
  paymentMethod (CASH|UPI|CARD),
  status (PENDING|PAID|REFUNDED)
}
```

## Real-Time Queue Updates

The application uses Socket.IO for real-time updates:

1. **Socket Events:**
   - `join-queue` - Patient joins queue monitoring
   - `leave-queue` - Patient leaves queue monitoring
   - `queue-update` - Broadcast when queue changes

2. **Queue Flow:**
   - Patient books appointment → Token generated
   - Patient checks in → Added to queue
   - Doctor calls next → Patient status = CALLED
   - Doctor starts consultation → Patient status = CONSULTING
   - Doctor completes → Patient status = COMPLETED
   - Real-time updates sent to all connected clients

3. **Waiting Time Calculation:**
   - Formula: `Patients Ahead × Average Consultation Time`
   - Average time updates based on completed consultations
   - Dynamic recalculation as queue progresses

## Deployment

### Deploy to Heroku (Backend)

```bash
cd server
heroku create MediQ-api
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### Deploy to Vercel (Frontend)

```bash
cd client
npm run build
# Push to GitHub, connect to Vercel, auto-deploys on push
# Update VITE_API_URL to production API URL
```

### Docker Deployment

```bash
docker-compose up -d
```

Configure `docker-compose.yml` with your MongoDB and environment variables.

## Features Walkthrough

### For Patients
1. **Register & Login**: Create account, login with email/password
2. **Book Appointment**: Select doctor, date, time
3. **View Queue**: Real-time queue status, estimated wait time
4. **Receive Notifications**: When called, approaching turn
5. **View Prescriptions**: See medicines prescribed by doctor
6. **Payment History**: View bills and payments

### For Doctors
1. **Login**: Access doctor dashboard
2. **View Today's Appointments**: See all scheduled appointments
3. **Queue Management**: Call next patient, start consultation
4. **Add Consultation Notes**: Document patient history
5. **Create Prescriptions**: Prescribe medicines
6. **View Analytics**: Consultation stats, revenue

### For Receptionists
1. **Clinic Overview**: Today's statistics and metrics
2. **Register Patients**: Create new patient accounts
3. **Check-in Patients**: Mark arrival, generate tokens
4. **Queue Control**: Call patients, skip, recall
5. **Payment Recording**: Record payments, refunds
6. **Clinic Management**: Manage all clinic operations

## Troubleshooting

### MongoDB Connection Error
- Verify MongoDB Atlas is running
- Check connection string in `.env`
- Ensure network access is allowed (0.0.0.0/0 for dev)
- Verify credentials are correct

### Socket.IO Connection Issues
- Ensure backend is running on port 5000
- Check VITE_SOCKET_URL environment variable
- Verify CORS configuration in server/src/index.js
- Check browser console for connection errors

### Authentication Failed
- Verify JWT_SECRET is set in `.env`
- Ensure token is being sent in Authorization header
- Check token expiration (7 days by default)
- Try logging out and logging back in

### Port Already in Use
```bash
# Kill process on port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## Demo Credentials

After running seed script:

**Patient:**
- Email: `rahul@example.com`
- Password: `Password123!`

**Doctor:**
- Email: `dr.sarah@clinic.com`
- Password: `Password123!`

**Receptionist:**
- Email: `receptionist@clinic.com`
- Password: `Password123!`

## Security Notes

⚠️ **Development Only:**
- JWT_SECRET is for demonstration
- Change in production to a strong random key
- Use environment variables for all secrets
- Enable HTTPS in production
- Restrict CORS origins
- Use secure cookies for sensitive data

## Performance Tips

1. **Queue Updates**: Configured to refresh every 10 seconds
2. **Database Indexes**: Added for frequently queried fields
3. **Redux Caching**: State persisted in localStorage
4. **Lazy Loading**: Routes are code-split for faster initial load
5. **MongoDB Optimization**: Use connection pooling, indexes on date queries

## Future Enhancements

- Email/SMS notifications
- Video consultation integration
- Advanced analytics & reporting
- Multi-clinic support
- Appointment reminders
- Patient feedback/ratings
- Integration with payment gateways
- Mobile app (React Native)
- Staff shift management
- Inventory management

## License

MIT License - Feel free to use for learning and commercial projects

## Support

For issues, questions, or contributions, please create an issue or pull request.

---

**Happy Clinic Management! 🏥**
