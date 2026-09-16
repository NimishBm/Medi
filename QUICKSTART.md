# ClinicFlow - Quick Start (5 Minutes)

## Copy-Paste Quick Start

### 1. Install Everything
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Setup Environment
```bash
# Create server/.env
cat > server/.env << 'EOF'
MONGO_URI=mongodb://localhost:27017/clinicflow
JWT_SECRET=dev_secret_key_change_in_production
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
EOF

# Create client/.env.local
cat > client/.env.local << 'EOF'
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
EOF
```

### 3. Start MongoDB (choose one)

**Option A: Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

**Option B: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Windows: Install MongoDB and run
mongod

# Linux
sudo systemctl start mongod
```

### 4. Seed Database
```bash
cd server
npm run seed
cd ..
```

**Demo Accounts Created:**
- Patient: `rahul@example.com` / `Password123!`
- Doctor: `dr.sarah@clinic.com` / `Password123!`
- Receptionist: `receptionist@clinic.com` / `Password123!`

### 5. Start Development Servers
```bash
npm run dev
```

**Open in Browser:**
- Frontend: http://localhost:5173
- API: http://localhost:5000
- Display (TV): http://localhost:5173/display

---

## What to Test

### Patient Flow
1. Login as `rahul@example.com`
2. Go to "Book Appointment"
3. Select a doctor and time
4. Check "My Appointments"
5. Go to "Live Queue"
6. See your token and estimated wait time

### Doctor Flow
1. Login as `dr.sarah@clinic.com`
2. Go to "Live Queue"
3. You see "Call Next Patient" button
4. Click it (updates patient dashboard instantly!)
5. See queue updates in real-time

### Receptionist Flow
1. Login as `receptionist@clinic.com`
2. View clinic dashboard (stats)
3. Go to "Appointments" → select a patient → "Check In"
4. Watch queue update in real-time on all screens

### Real-Time Magic ✨
- Open 2 browsers (doctor + patient in different windows)
- Doctor clicks "Call Next Patient"
- Patient sees their token status change INSTANTLY
- No page refresh needed!

---

## File Structure

```
MediQueue/
├── server/          # Backend (Node/Express/MongoDB)
├── client/          # Frontend (React/Vite)
├── README.md        # Full documentation
├── SETUP.md         # Detailed setup
├── DEPLOYMENT.md    # Production deployment
├── ARCHITECTURE.md  # Technical design
└── QUICKSTART.md    # This file
```

---

## Common Issues

### "Port 5000 already in use"
```bash
# Kill process
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000 && taskkill /PID <PID> /F  # Windows
```

### "MongoDB connection error"
```bash
# Check if running
mongosh  # MongoDB CLI

# Or start Docker
docker ps  # See if mongodb container running
docker start mongodb  # If not running
```

### "Cannot find module"
```bash
# Reinstall
rm -rf server/node_modules server/package-lock.json
cd server && npm install && cd ..
```

### "Queue not updating in real-time"
1. Check browser console for errors
2. Verify both server and client running
3. Try refreshing page
4. Check socket connection in DevTools → Network → WS

---

## Next Steps

### After Quick Start Works

1. **Explore the Code**
   - Check `server/src/routes/` for API
   - Check `client/src/pages/` for UI
   - Check `server/src/models/` for database schema

2. **Add Features**
   - Notifications
   - Email reminders
   - Payment integration
   - Advanced analytics

3. **Deploy to Production**
   - See DEPLOYMENT.md
   - Choose: Docker, Heroku, AWS, DigitalOcean, Railway

4. **Customize**
   - Update branding (colors, logo)
   - Add your clinic information
   - Customize appointments types
   - Configure working hours

---

## Architecture at a Glance

```
┌─ PATIENT BROWSER ─┐
│   React App       │
│   ├─ Book Apt     │ ← Socket.IO (Real-time queue)
│   ├─ View Queue   │
│   └─ Prescriptions│
└───────────┬───────┘
            │ REST API + WebSocket
            ▼
┌─ NODE SERVER ─────┐
│ Express.js        │
│ ├─ Auth           │
│ ├─ Queue Logic    │
│ ├─ Socket.IO      │
│ └─ API Routes     │
└───────────┬───────┘
            │
            ▼
┌─ MONGODB ─────────┐
│ Collections:      │
│ ├─ Users          │
│ ├─ Appointments   │
│ ├─ Queue          │
│ └─ etc.           │
└───────────────────┘
```

---

## Key Features

✅ **Real-Time Queue Updates** - Using Socket.IO
✅ **Patient Notifications** - In-app, updates instantly
✅ **Role-Based Access** - Patient/Doctor/Receptionist
✅ **Smart Waiting Time** - Calculates based on consultation history
✅ **Prescription Management** - Doctors create, patients view
✅ **Payment Tracking** - Simple billing system
✅ **Public Display** - Waiting room display for TVs
✅ **Responsive Design** - Works on all devices
✅ **JWT Security** - Encrypted passwords, token auth
✅ **Production Ready** - Can deploy to cloud

---

## Troubleshooting Summary

| Issue | Solution |
|-------|----------|
| Port in use | Kill process: `lsof -ti:5000 \| xargs kill -9` |
| MongoDB error | Start MongoDB: `docker run -d -p 27017:27017 mongo` |
| Module not found | Reinstall: `npm install` in that directory |
| Socket not connecting | Check server is running: `http://localhost:5000/health` |
| Login fails | Check seed ran: `cd server && npm run seed` |
| Queue not updating | Open browser console, check for errors |

---

## One Last Thing

### Keyboard Shortcuts
- Open Dev Console: `F12`
- Check API calls: Network tab
- Debug state: React DevTools
- Check socket: Network → WS filter

### Pro Tips
- Use Demo accounts for testing
- Open multiple browser windows to test real-time
- Check MongoDB data: Use MongoDB Compass
- Monitor API: Check Network tab in DevTools

---

**Happy hacking! The full clinic management system is ready to go.** 🚀

Questions? Check README.md or ARCHITECTURE.md for detailed info.
