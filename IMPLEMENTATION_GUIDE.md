# MediQueue Patient Experience Update - Implementation Guide

## ✅ What's Been Added

### Backend Changes (✓ Complete)

1. **User Model** - Added family members support
   - New `familyMembers` array field with: name, relationship, dateOfBirth, gender, allergies
   - File: `server/src/models/User.js`

2. **Appointment Model** - Added family booking fields
   - New `bookedBy` field: tracks who booked the appointment (for family bookings)
   - New `bookedFor` field: stores family member info (name, relationship, isFamilyMember flag)
   - File: `server/src/models/Appointment.js`

3. **Auth Routes** - Added profile update endpoint
   - New `PUT /auth/me` endpoint to update profile and family members
   - File: `server/src/routes/auth.js`

4. **Appointment Routes** - Updated for family booking support
   - GET `/appointments` now returns both owned appointments AND family appointments (where bookedBy = user)
   - POST `/appointments` accepts bookedFor and bookedBy fields
   - File: `server/src/routes/appointments.js`

### Frontend Changes (✓ Complete)

5. **API Services** - Added user management
   - New `userAPI` with getMe() and updateMe() methods
   - File: `client/src/services/api.js`

6. **Book Appointment Page** - Major enhancements
   - Quick-pick symptom buttons (Fever, Skin Issues, Heart Pain, Eye Problem, Bone Pain)
   - Enhanced doctor cards showing: experience, qualifications, consultation fee
   - "Book for" section: radio buttons to select Myself or Family Member
   - Family member dropdown selector
   - Passes bookedFor/bookedBy when booking for family
   - File: `client/src/pages/patient/BookAppointment.jsx`

7. **Family Members Page** - NEW
   - Add family member inline form (name, relationship, DOB, gender, allergies)
   - List all family members with delete option
   - Saves to backend via userAPI.updateMe()
   - Updates Redux store automatically
   - File: `client/src/pages/patient/FamilyMembers.jsx`

8. **Appointments Page** - Significant improvements
   - Status tabs: All | Upcoming | Past | Cancelled
   - Client-side date filtering
   - Shows "Booked for: [Name]" badge for family appointments
   - Improved cancel confirmation UI
   - Updated sidebar nav to include Family Members
   - File: `client/src/pages/patient/Appointments.jsx`

9. **Dashboard** - Real-time stats
   - Upcoming Visits (calculated from appointments)
   - Total Appointments (non-cancelled)
   - Completed appointments count
   - Family Members count
   - File: `client/src/pages/patient/Dashboard.jsx`

10. **App Routes** - Added family members route
    - New `/patient/family` route
    - File: `client/src/App.jsx`

---

## 🚀 How to Run

### Step 1: Reset Database (First Time Only)

```bash
cd server
npm run seed
```

This will:
- Clear all existing data
- Create demo doctors, patients, receptionist
- Generate sample appointments
- Output demo login credentials

### Step 2: Start Backend

```bash
cd server
npm run dev
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

### Step 3: Start Frontend (New Terminal)

```bash
cd client
npm run dev
```

Expected output:
```
Local: http://localhost:5173
```

---

## 🧪 Testing the Features

### Test 1: Add Family Member
1. Login as: `rahul@example.com / Password123!`
2. Go to **Patient → Family Members** (sidebar)
3. Click **+ Add Member**
4. Fill form:
   - Name: Riya Kumar
   - Relationship: Child
   - DOB: 2015-05-20
   - Gender: Female
   - Allergies: Penicillin
5. Click **Add Member**
6. Verify: Family member card appears, can remove it

### Test 2: Book Appointment for Family
1. Go to **Book Appointment**
2. Click quick symptom chip: **"Fever"**
3. Verify: Shows General Physicians with fallback banner
4. Select a doctor (any one)
5. Select **"Family Member"** radio button
6. Choose: **Riya Kumar (Child)** from dropdown
7. Pick date, time, optionally add reason
8. Click **Confirm Appointment**
9. Verify: Redirects to Appointments page

### Test 3: View Appointments with Tabs
1. Go to **My Appointments**
2. Verify tabs: All | Upcoming | Past | Cancelled (all clickable)
3. Click **Upcoming** tab
4. Verify: Only shows future appointments
5. Look for the appointment you just booked
6. Verify: Shows **"Booked for: Riya Kumar (Child)"** badge
7. Click other tabs to test filtering

### Test 4: Dashboard Real Stats
1. Go to **Patient Dashboard**
2. Verify stat cards:
   - **Upcoming Visits**: Count of future non-cancelled appointments
   - **Total Appointments**: Count of all non-cancelled appointments
   - **Completed**: Count of appointments with status COMPLETED
   - **Family Members**: Shows "1" (Riya Kumar you added)

### Test 5: Doctor Search by Symptom
1. Go to **Book Appointment**
2. Try different quick-pick buttons:
   - **Fever** → Shows General Physicians
   - **Skin Issues** → Shows Dermatologist (Dr. Priya)
   - **Heart Pain** → Shows Cardiologist (Dr. Rajesh)
3. Type manually in search: `"eye"` → Shows Ophthalmologist
4. Type invalid: `"xyz123"` → Falls back to General Physicians with yellow banner

### Test 6: Doctor Cards Show More Info
1. Go to **Book Appointment**
2. Look at each doctor card - should show:
   - Doctor name
   - Specialization
   - 🎯 Years of experience
   - Qualification badges (e.g., MBBS, MD)
   - Consultation fee
   - Room number

---

## 📊 Database Schema Changes

### User Collection - Added
```
familyMembers: [{
  name: String (required),
  relationship: String (required) - e.g., "Spouse", "Child", "Parent"
  dateOfBirth: Date (optional),
  gender: String (optional) - "M", "F", "Other"
  allergies: [String] (optional)
}]
```

### Appointment Collection - Added
```
bookedBy: ObjectId (optional) - Reference to User who booked (for family bookings)
bookedFor: {
  name: String,
  relationship: String,
  isFamilyMember: Boolean (default: false)
}
```

---

## 🔧 Troubleshooting

### "404 Not Found" when booking
- Ensure backend is running on port 5000
- Check `.env` files are correct
- Verify VITE_API_URL=http://localhost:5000/api (note the `/api`)

### Family members not showing
- Make sure you're using the seeded user (rahul@example.com)
- Check browser localStorage is working
- Try clearing localStorage and logging in again

### Appointment not appearing after booking
- Refresh the Appointments page
- Check browser console for API errors
- Verify patientId is being sent correctly

### Search not working
- Ensure the search text matches symptom keywords (case-insensitive)
- Try the quick-pick buttons instead
- Check browser console for errors

---

## 📝 API Endpoints Reference

### New/Modified Endpoints

| Method | Endpoint | Changes |
|--------|----------|---------|
| GET | `/api/auth/me` | Existing, returns user with familyMembers array |
| **PUT** | **`/api/auth/me`** | **NEW** - Update profile and family members |
| GET | `/api/appointments` | Modified: Also returns appointments where bookedBy=userId |
| POST | `/api/appointments` | Modified: Accepts bookedFor and bookedBy fields |

---

## 🎯 Next Steps / Future Enhancements

- [ ] Edit family member details
- [ ] Prescription history for family members
- [ ] Family member medical history tracking
- [ ] Appointment reminders via SMS/Email
- [ ] Doctor availability calendar view
- [ ] Payment history with multiple family member filter
- [ ] Prescription sharing between family members

---

## 📋 Files Modified/Created

**Modified:**
- `server/src/models/User.js`
- `server/src/models/Appointment.js`
- `server/src/routes/auth.js`
- `server/src/routes/appointments.js`
- `client/src/services/api.js`
- `client/src/pages/patient/BookAppointment.jsx`
- `client/src/pages/patient/Appointments.jsx`
- `client/src/pages/patient/Dashboard.jsx`
- `client/src/App.jsx`

**Created:**
- `client/src/pages/patient/FamilyMembers.jsx`

---

## ✨ Performance & Reliability Notes

- All family member updates trigger Redux state refresh for real-time UI sync
- Appointment filtering done client-side (already have all data)
- Family member selector only shows when user has added members
- Fallback UI shown when no specialists match symptom search
- Cancel operations show loading state and confirmation

---

Happy testing! 🎉
