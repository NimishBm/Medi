# ClinicFlow - Architecture & Technical Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│          ┌────────────────────────────────────┐             │
│          │   Redux State Management           │             │
│          │   - Auth, Queue, Appointments      │             │
│          └────────────────────────────────────┘             │
│                         │                                    │
│          ┌──────────────┴──────────────┐                    │
│          ▼                             ▼                    │
│    REST API Calls              Socket.IO Connection        │
│    (Axios)                      (Real-time Updates)        │
│          │                             │                    │
└──────────┼─────────────────────────────┼──────────────────┘
           │                             │
           │ HTTP/HTTPS                  │ WebSocket
           │                             │
┌──────────┼─────────────────────────────┼──────────────────┐
│          ▼                             ▼                   │
│    ┌──────────────────────────────────────┐                │
│    │   Express.js Server                  │                │
│    │   - REST API Routes                  │                │
│    │   - Socket.IO Server                 │                │
│    │   - Authentication Middleware        │                │
│    │   - Queue Management Logic           │                │
│    └──────────────────────────────────────┘                │
│             │                                              │
│             ▼                                              │
│    ┌──────────────────────────────────────┐                │
│    │   MongoDB Atlas Database             │                │
│    │   - Collections:                     │                │
│    │     • Users (Patients, Doctors, etc) │                │
│    │     • Appointments                   │                │
│    │     • Queue                          │                │
│    │     • Consultations                  │                │
│    │     • Prescriptions                  │                │
│    │     • Payments                       │                │
│    └──────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── Login/Register Pages
├── Protected Routes
│   ├── Patient Routes
│   │   ├── Dashboard
│   │   ├── BookAppointment
│   │   ├── LiveQueue
│   │   ├── Prescriptions
│   │   ├── History
│   │   ├── Payments
│   │   └── Appointments
│   ├── Doctor Routes
│   │   ├── Dashboard
│   │   ├── Queue Management
│   │   └── Appointments
│   └── Receptionist Routes
│       ├── Dashboard
│       ├── Appointment Management
│       └── Queue Management
└── Public Routes
    └── WaitingRoomDisplay
```

### State Management (Redux)

```
Store
├── auth
│   ├── user
│   ├── token
│   ├── isLoading
│   └── error
└── queue
    ├── queue (array)
    ├── stats (counts)
    ├── currentPatient
    ├── isLoading
    └── error
```

### Service Layer

```
services/
├── api.js
│   └── Centralized API calls
│       ├── authAPI
│       ├── doctorAPI
│       ├── appointmentAPI
│       ├── queueAPI
│       ├── consultationAPI
│       ├── prescriptionAPI
│       ├── paymentAPI
│       └── analyticsAPI
└── socket.js
    └── Socket.IO initialization & events
```

---

## Backend Architecture

### REST API Structure

```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── GET /me
├── /doctors
│   ├── GET /
│   └── GET /:id
├── /appointments
│   ├── POST /
│   ├── GET /
│   ├── GET /today
│   ├── GET /:id
│   ├── PUT /:id
│   ├── POST /:id/cancel
│   └── POST /:id/check-in
├── /queue
│   ├── GET /doctor/:doctorId
│   ├── POST /call-next
│   ├── POST /skip
│   ├── POST /recall
│   ├── POST /start-consultation
│   ├── POST /complete-consultation
│   └── POST /no-show
├── /consultations
│   ├── POST /
│   ├── GET /patient/:patientId
│   ├── GET /:id
│   └── PUT /:id
├── /prescriptions
│   ├── POST /
│   ├── GET /patient/:patientId
│   └── GET /:id
├── /payments
│   ├── POST /
│   ├── GET /patient/:patientId
│   ├── GET /:id
│   └── POST /:id/refund
└── /analytics
    ├── GET /today
    ├── GET /doctor/:doctorId
    └── GET /clinic/overview
```

### Middleware Stack

```
Express Server
├── CORS Middleware
├── JSON Parser
├── Error Handling Middleware
├── Routes
│   ├── Auth Routes (public)
│   ├── Doctor Routes (public read)
│   └── Protected Routes
│       ├── JWT Verification
│       ├── Role Authorization
│       └── Route Handler
└── Global Error Handler
```

### Authentication Flow

```
1. User Registration
   └─> Password Hashed (bcryptjs)
   └─> User saved to MongoDB
   └─> JWT generated
   └─> Token sent to client

2. User Login
   └─> User found in DB
   └─> Password compared (bcryptjs)
   └─> JWT generated
   └─> Token sent to client
   └─> Stored in localStorage

3. Protected API Call
   └─> Token in Authorization header
   └─> Middleware verifies JWT
   └─> User ID attached to request
   └─> Route handler executes
```

---

## Database Schema Design

### User Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  phone: String,
  password: String (hashed),
  role: Enum (PATIENT, DOCTOR, RECEPTIONIST),
  
  // Discriminator fields based on role
  // Patient fields
  dateOfBirth: Date,
  gender: Enum (M, F, Other),
  medicalHistory: Array,
  allergies: Array,
  
  // Doctor fields
  specialization: String,
  consultationFee: Number,
  roomNumber: String,
  qualifications: Array,
  experience: Number,
  availability: Object,
  averageConsultationTime: Number,
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Collection

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  appointmentDate: Date (indexed),
  appointmentTime: String,
  status: Enum,
  tokenNumber: Number,
  notes: String,
  reason: String,
  priority: Boolean,
  priorityReason: String,
  priorityChangedBy: ObjectId,
  priorityChangedAt: Date,
  checkInTime: Date,
  calledTime: Date,
  consultationStartTime: Date,
  consultationEndTime: Date,
  runningLate: Object,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- patientId, appointmentDate
- doctorId, appointmentDate
- tokenNumber, doctorId, appointmentDate
```

### Queue Collection

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: User, indexed),
  appointmentId: ObjectId (ref: Appointment),
  patientId: ObjectId (ref: User),
  tokenNumber: Number,
  queueDate: Date (indexed),
  status: Enum,
  position: Number,
  calledAt: Date,
  consultationStartAt: Date,
  consultationEndAt: Date,
  consultationDuration: Number,
  skippedAt: Date,
  noShowAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- doctorId, queueDate, status
- patientId, queueDate
```

---

## Real-Time Queue System

### Flow Diagram

```
1. Patient Books Appointment
   └─> Token Generated (#1, #2, #3...)
   └─> Added to BOOKED status

2. Receptionist Checks In Patient
   └─> Status → CHECKED_IN
   └─> Queue entry created
   └─> Status → WAITING
   └─> Socket broadcast: queue-update

3. Doctor Views Queue
   └─> Connects to queue room via Socket.IO
   └─> Receives current queue state
   └─> socket.emit('join-queue', {doctorId})

4. Doctor Calls Next Patient
   └─> Socket broadcasts: queue-update
   └─> Queue.status → CALLED
   └─> Appointment.status → CALLED
   └─> All connected clients updated

5. Doctor Starts Consultation
   └─> Queue.status → CONSULTING
   └─> Appointment.status → CONSULTING
   └─> Patient UI shows "in progress"

6. Doctor Completes Consultation
   └─> Queue.status → COMPLETED
   └─> consultationDuration calculated
   └─> Doctor's averageConsultationTime updated
   └─> Next patient status → CALLED
   └─> Loop continues
```

### Socket.IO Implementation

**Server:**
```javascript
io.on('connection', (socket) => {
  socket.on('join-queue', (data) => {
    socket.join(`queue-${data.doctorId}`);
  });
  
  socket.on('leave-queue', (data) => {
    socket.leave(`queue-${data.doctorId}`);
  });
});

// When queue updates:
io.emit('queue-update', {
  doctorId: doctorId,
  nextPatient: patient,
  timestamp: Date.now()
});
```

**Client:**
```javascript
const socket = getSocket();

socket.emit('join-queue', { doctorId: appointment.doctorId._id });

socket.on('queue-update', () => {
  // Refetch queue
  // Update UI
});
```

---

## Waiting Time Calculation Algorithm

```javascript
calculateWaitingTime(patientsAhead, doctors) {
  // Get doctor's average consultation time
  const avgTime = doctor.averageConsultationTime || 10; // default 10 min
  
  // Calculate based on patients ahead
  const estimatedWait = patientsAhead * avgTime;
  
  // Consider ongoing consultation
  if (consulting) {
    const elapsed = Date.now() - consulting.consultationStartAt;
    const remaining = avgTime * 60 * 1000 - elapsed;
    return estimatedWait + Math.max(remaining, 0);
  }
  
  return estimatedWait;
}
```

---

## Error Handling Strategy

### HTTP Status Codes

```
200 OK              - Successful request
201 Created         - Resource created
400 Bad Request     - Invalid input
401 Unauthorized    - Missing/invalid token
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource not found
409 Conflict        - Duplicate booking
500 Server Error    - Unexpected error
```

### Error Response Format

```javascript
{
  message: "Error description",
  statusCode: 400,
  data: {} // Optional additional data
}
```

### Frontend Error Handling

```javascript
try {
  const response = await api.call();
  // Success
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
    dispatch(logout());
  } else if (error.response?.status === 403) {
    // Show permission denied
    toast.error("You don't have permission");
  } else {
    // Show generic error
    toast.error(error.response?.data?.message || 'Something went wrong');
  }
}
```

---

## Security Architecture

### Authentication

1. **Password Hashing**
   - bcryptjs with salt rounds = 10
   - Passwords never stored in plain text

2. **JWT Tokens**
   - Issued on login
   - Stored in localStorage
   - Sent in Authorization header
   - Verified on each API call

3. **Session Management**
   - Tokens expire in 7 days
   - Can manually logout
   - Token removed on logout

### Authorization

1. **Role-Based Access Control**
   ```javascript
   authorize(...roles) {
     return (req, res, next) => {
       if (!roles.includes(req.user.role)) {
         return res.status(403).json({ message: 'Forbidden' });
       }
       next();
     };
   }
   ```

2. **Resource-Level Authorization**
   - Patients can only view their own appointments
   - Doctors can only access their queue
   - Receptionists have clinic-wide access

### Data Protection

1. **Sensitive Data**
   - Passwords never returned in API
   - Medical records protected
   - Payment information encrypted

2. **CORS Configuration**
   ```javascript
   cors({
     origin: process.env.CLIENT_URL,
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE']
   })
   ```

---

## Performance Optimization

### Database Optimization

1. **Indexes**
   ```javascript
   // Fast queries
   - User.email
   - Appointment.appointmentDate
   - Queue.doctorId, queueDate
   - Consultation.patientId, createdAt
   ```

2. **Query Optimization**
   ```javascript
   // Use lean() for read-only queries
   const queue = await Queue.find({...}).lean();
   
   // Populate selectively
   const apt = await Appointment
     .findById(id)
     .populate('patientId', 'name email phone')
     .populate('doctorId', 'name specialization');
   ```

### Frontend Optimization

1. **Code Splitting**
   - Routes lazy loaded with React.lazy()
   - Components split by page

2. **State Management**
   - Redux prevents unnecessary API calls
   - Caching in localStorage

3. **Network Optimization**
   - Axios request/response interceptors
   - Batch operations where possible

### Caching Strategy

```javascript
// API responses cached in Redux
// Revalidate on specific actions

// Frontend caching:
- User data: Cache in Redux until logout
- Appointments: Cache, revalidate on create/update
- Queue: Real-time via Socket.IO
- Doctors: Cache after initial fetch
```

---

## Scalability Considerations

### Horizontal Scaling

1. **Load Balancer**
   - Nginx/HAProxy distributes requests
   - Multiple server instances

2. **Session Management**
   - Store sessions in Redis
   - Share across instances

3. **Database**
   - MongoDB replica set
   - Sharding for large datasets

### Vertical Scaling

1. **Server Resources**
   - Increase CPU/RAM
   - Optimize code

2. **Database**
   - Connection pooling
   - Query optimization
   - Indexing strategy

### Bottleneck Analysis

1. **Queue Updates**
   - Socket.IO broadcasts to room
   - Scales horizontally with Redis adapter

2. **Database Queries**
   - Heavy indexing on appointment queries
   - Aggregation pipeline for analytics

3. **File Uploads**
   - Not implemented (future feature)
   - Would use S3/Cloud Storage

---

## Deployment Architecture

### Development
```
React Dev Server (5173)
↓
Vite HMR
↓
Node Dev Server (5000)
↓
MongoDB Local/Atlas
```

### Production (Docker)
```
Docker Container 1: MongoDB
Docker Container 2: Node Server
Docker Container 3: React (nginx)
↓
Docker Network
```

### Production (Cloud)
```
CDN
↓
Frontend (Vercel/S3)  Backend (Heroku/EC2)
↓                     ↓
User Browser ← API Call ← MongoDB Atlas
```

---

## Monitoring & Observability

### Logging

```javascript
// HTTP request logging
morgan('combined');

// Application logging
console.log('Event:', data);

// Error logging
console.error('Error:', error);
```

### Metrics to Monitor

1. **API Performance**
   - Response time
   - Error rate
   - Request volume

2. **Queue Performance**
   - Queue length
   - Consultation duration
   - Wait time accuracy

3. **Database Performance**
   - Query time
   - Connection count
   - Data size

4. **System Health**
   - CPU usage
   - Memory usage
   - Uptime

---

## Future Enhancements

1. **Real-Time Notifications**
   - Push notifications
   - Email reminders
   - SMS alerts

2. **Video Consultation**
   - WebRTC integration
   - Video recording

3. **Advanced Analytics**
   - Dashboard with charts
   - Patient satisfaction ratings
   - Revenue reports

4. **Mobile Application**
   - React Native app
   - Offline support

5. **Multi-Clinic Support**
   - Organization management
   - Clinic-specific settings
   - Inter-clinic referrals

6. **AI Features**
   - Appointment recommendations
   - Queue prediction
   - Smart scheduling

---

## Troubleshooting Guide

### Common Issues

1. **Socket Connection Fails**
   - Check server is running
   - Verify CORS settings
   - Check firewall

2. **Queue Not Updating**
   - Verify Socket.IO connection
   - Check client is in correct room
   - Check server is broadcasting

3. **Authentication Issues**
   - Verify JWT_SECRET matches
   - Check token expiration
   - Clear localStorage

4. **Database Connection**
   - Verify MongoDB is running
   - Check connection string
   - Verify network access

---

## References & Resources

- Express.js Documentation: https://expressjs.com
- React Documentation: https://react.dev
- MongoDB Documentation: https://docs.mongodb.com
- Socket.IO Documentation: https://socket.io/docs
- Redux Toolkit: https://redux-toolkit.js.org

---

This architecture is designed to scale from a small clinic to a multi-location enterprise system while maintaining code quality and performance.
