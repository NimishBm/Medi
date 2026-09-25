# Browser Notifications Implementation Guide - MediQ

## Overview

The MediQ project has a complete real-time browser notification system for doctors. When a patient books an appointment with a doctor, the doctor receives:

1. **In-app notification** (always visible in the notification bell)
2. **Browser notification** (OS-level popup, if permission granted)
3. **Dashboard notification** (stored in MongoDB and displayed in the bell dropdown)

---

## Architecture

### Complete Patient → Doctor Notification Flow

```
1. Patient clicks "Book Appointment" → Fills form → Submits booking request
                          ↓
2. Frontend calls: appointmentAPI.createAppointment(payload)
                          ↓
3. Backend (POST /appointments):
   - Creates Appointment document in MongoDB
   - Generates token number for the day
   - Creates Queue entry if booking is for today
   - Creates Notification document in MongoDB
   - Emits Socket.IO events to doctor's rooms:
     * io.to(`doctor-${doctorId}`).emit('new-appointment', {...})
     * io.to(`notifications-${doctorId}`).emit('new-notification', {...})
   - Returns appointment confirmation
                          ↓
4. Frontend shows "Appointment booked!" toast
                          ↓
5. Doctor's browser receives real-time Socket.IO events:
   - useDoctorNotifications hook listens for 'new-appointment'
   - NotificationBell component listens for 'new-notification'
                          ↓
6. Three notifications appear for doctor:
   a. In-app toast notification (react-hot-toast)
   b. Browser/OS notification (if permission granted)
   c. Badge updates in notification bell dropdown
```

---

## Files Modified/Used

### Frontend

#### 1. **client/src/services/socket.js** (Existing - No changes needed)
- Establishes Socket.IO connection
- `initSocket()` - Creates socket connection with reconnection logic
- `joinRooms(role, id)` - Joins socket rooms based on user role
- For doctors: `join-doctor-notifications` event joins `doctor-${id}` and `notifications-${id}` rooms

#### 2. **client/src/hooks/useDoctorNotifications.js** (Existing - Already complete)
- React hook that runs on every doctor dashboard page
- Responsibilities:
  - Joins doctor's socket notification room
  - Shows in-app toast on new appointment
  - Shows browser notification (if permission granted)
  - Exports `requestBrowserPermission()` for requesting user permission
- Called in DoctorDashboard.jsx at line 49: `useDoctorNotifications(user?._id)`

#### 3. **client/src/components/NotificationBell.jsx** (Existing - Already complete)
- Notification dropdown UI component
- Displays all notifications from MongoDB
- Shows unread badge count
- Features:
  - "Enable browser notifications" button (visible until permission granted)
  - Mark all read / Clear all buttons
  - Real-time badge updates via Socket.IO
  - Fetches notifications from API and polls every 30s
  - Listens to socket events: 'new-notification' and 'new-appointment'

#### 4. **client/src/pages/doctor/Dashboard.jsx** (Already using useDoctorNotifications)
- Line 49: `useDoctorNotifications(user?._id);` - Initializes browser notifications
- NotificationBell component rendered in header

#### 5. **client/src/services/api.js** (Existing - Already complete)
- notificationAPI.getNotifications() - Fetch all notifications
- notificationAPI.markRead(id) - Mark single as read
- notificationAPI.markAllRead() - Mark all as read
- notificationAPI.deleteOne(id) - Delete single notification
- notificationAPI.clearAll() - Delete all notifications

### Backend

#### 1. **server.js** (Socket.IO setup - Already complete)
- Lines 184-208: Socket.IO event handlers
- Handles `join-doctor-notifications` event
- Doctor joins two rooms: `doctor-${doctorId}` and `notifications-${doctorId}`

#### 2. **routes/appointments.js** (Appointment booking - Already complete)
- Lines 118-152: Creates notification and emits socket events
- Creates Notification document in MongoDB
- Emits `new-appointment` to `doctor-${doctorId}` room
- Emits `new-notification` to `notifications-${doctorId}` room
- Payload includes: patientName, appointmentDate, appointmentTime, tokenNumber, bookedFor

#### 3. **routes/notifications.js** (Notification API - Already complete)
- GET /notifications - Fetch notifications for logged-in user
- PUT /notifications/read-all - Mark all as read
- PUT /notifications/:id/read - Mark single as read
- DELETE /notifications/:id - Delete single notification
- DELETE /notifications - Clear all notifications

#### 4. **models/Notification.js** (Data model - Already complete)
- Stores all notification data
- Fields: recipientId, type, title, message, data, read, appointmentId, etc.

---

## Web Notifications API Integration

### Permission Flow

1. Browser first-time visit → Notification.permission = 'default'
2. User clicks "Enable browser notifications" button in NotificationBell
3. requestBrowserPermission() is called
4. Browser shows native permission dialog
5. User grants or denies
6. Notification.permission becomes 'granted' or 'denied'
7. "Enable" button disappears once granted

### Notification Content

When doctor receives a browser notification:
- **Title**: "📅 New Appointment — [Patient Name]"
- **Body**: Includes time, date, token number, family member info (if applicable)
- **Icon**: Project favicon
- **Tag**: `appt-${appointmentId}` (deduplicates notifications)
- **Click Action**: Clicking notification focuses the MediQ tab

### Code Location
- useDoctorNotifications.js lines 51-83: `showBrowserNotification(data)`

---

## How to Test

### Prerequisites
- Two browser windows/tabs (or devices)
- Backend running (npm run dev from root or server directory)
- Frontend running (npm run dev from client directory)
- Both connected to same MongoDB

### Test Scenario: Patient Books → Doctor Receives Notification

#### **Setup (5 minutes)**

**Step 1: Start Backend**
```bash
cd C:\Users\MeesalaGreeshmaSathv\Desktop\Medi
npm run dev  # or: node server.js
```
Note the URL (typically http://localhost:5000)

**Step 2: Start Frontend**
```bash
cd client
npm run dev  # or: npm run dev:host
```
Note the URL (typically http://localhost:5173)

**Step 3: Open Two Browser Windows**
- **Window 1 (Patient)**: http://localhost:5173
- **Window 2 (Doctor)**: http://localhost:5173

---

### Test Execution

#### **Step 1: Doctor Login & Permission Grant (Window 2)**
1. Go to http://localhost:5173
2. Click "Login as Doctor"
3. Enter doctor credentials (or create test doctor)
4. You're now on Doctor Dashboard
5. Look for notification bell (🔔) in top-right header
6. Click notification bell → Panel opens
7. Click "Enable browser notifications for new appointments"
8. Browser asks permission → Click "Allow"
9. Button disappears (permission now = 'granted')
10. Keep this window/tab open and visible

**Expected**: Bell icon visible, permission button shows/disappears correctly

---

#### **Step 2: Patient Booking (Window 1)**
1. Go to http://localhost:5173
2. Click "Login as Patient"
3. Enter patient credentials (or create test patient)
4. Navigate to "Marketplace" or browse doctors
5. Click on the doctor you used in Step 1
6. Click "Book Appointment"
7. Fill out booking form:
   - Select appointment date (today or future)
   - Select appointment time (any available slot)
   - Optionally add reason/notes
8. Click "Book Appointment"

**Expected**: Toast shows "Appointment booked!"

---

#### **Step 3: Doctor Receives Notifications (Window 2)**
Watch for THREE notifications appearing in Window 2:

**A. In-App Toast Notification**
- **When**: Immediately after patient books
- **What**: Green toast appearing at top-right saying "📅 New appointment" with patient name and time
- **Duration**: 7 seconds
- **Appears even if**: Browser permission not granted

**B. Browser/OS Notification**
- **When**: Immediately after patient books
- **What**: OS-level popup showing appointment details (patient name, date, time, token number)
- **Appears only if**: Permission = 'granted' from Step 1
- **Action**: Click it → MediQ tab focuses
- **Location**: Varies by OS (top-right on Windows, different on Mac/Linux)

**C. Notification Bell Badge Update**
- **When**: Immediately after patient books
- **What**: 
  - Bell icon shows red badge with "1" (unread count)
  - Click bell → Panel opens with new notification listed
  - Notification shows patient name, date, time, token
  - Appears with "unread" styling (blue dot on the left)

---

### Expected Results

| Component | Visible | Behavior |
|-----------|---------|----------|
| Toast (in-app) | Always | Appears 7 seconds, auto-closes |
| Browser Notification | If permission='granted' | Click to focus tab, auto-closes after 7 seconds |
| Bell Badge Count | Always | Shows "1" after new appointment |
| Bell Panel Notification | Always | Listed with blue dot (unread), can mark read/delete |

---

### Advanced Testing

#### Test: Multiple Appointments
1. From patient window, book 3 appointments with the same doctor
2. Each should trigger its own notification
3. Bell badge should show "3"
4. Each browser notification appears separately (won't deduplicate)

#### Test: Permission Denied
1. Revoke browser notification permission in browser settings
2. Go back to Doctor Dashboard
3. Book another appointment
4. Toast and bell update work
5. Browser notification should NOT appear
6. No errors in console

#### Test: Socket Reconnection
1. Doctor logged in, permission granted
2. Disconnect network (DevTools → Network → Offline)
3. Patient books appointment
4. Reconnect network
5. Doctor should receive notification within 30s (when connection restores)

#### Test: Multiple Doctors
1. Two different doctor accounts logged in, each with permission granted
2. Patient books with Doctor A
3. Doctor A receives notification, Doctor B doesn't

---

## Troubleshooting

### Issue: No notifications appearing

**Check 1: Socket connected?**
- Open browser DevTools → Console
- Type: `localStorage.getItem('token')`
- If undefined, user not logged in

**Check 2: Socket.IO listeners active?**
- Console: Look for "Socket connected: [id]" message
- If not present, socket.io not connecting

**Check 3: Room joined?**
- Send message from patient window to doctor window
- Check browser console for errors
- Verify doctor ID matches (copy from URL or Redux state)

### Issue: Browser notification not appearing (but toast works)

**Check 1: Permission granted?**
- Open browser settings → Notifications → MediQ site
- Should show "Allow" not "Block"
- Reset if needed: Clear site data and reload

**Check 2: Browser tab in background?**
- Browser notifications only show when tab is background/hidden
- Foreground toast is used instead (this is intentional)

**Check 3: Notification.permission value**
- Console: `Notification.permission`
- Should be 'granted' if button disappeared
- If 'denied', re-enable in browser settings

### Issue: Notifications appear for wrong doctor

**Check**: Verify doctorId in request
- Check URL: `/patient/doctors/:doctorId/book`
- Doctor ID should match the one who logged in

### Issue: Appointment created but no socket event

**Check**: Backend logs
- Look for "[Queue] entry created" or socket emit statements
- Verify appointment was saved to MongoDB
- Check `io.to('doctor-${doctorId}')` calls in routes/appointments.js

---

## Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| client/src/services/socket.js | Socket.IO client setup | ✅ Complete |
| client/src/hooks/useDoctorNotifications.js | Browser notification logic | ✅ Complete |
| client/src/components/NotificationBell.jsx | Notification UI | ✅ Complete |
| client/src/services/api.js | Notification API calls | ✅ Complete |
| server.js | Socket.IO server setup | ✅ Complete |
| routes/appointments.js | Booking & notification emit | ✅ Complete |
| routes/notifications.js | Notification CRUD API | ✅ Complete |
| models/Notification.js | Notification data model | ✅ Complete |

---

## Implementation Details

### What Was Already Built

1. **Socket.IO Infrastructure**: Complete, with room management
2. **Web Notifications API**: Integrated, with permission handling
3. **Notification Database**: Storing all notifications
4. **Backend Emission**: Appointments emit real-time events
5. **Frontend Listening**: Hooks and components listen for events

### What Happens Behind the Scenes

1. When a doctor navigates to Dashboard, `useDoctorNotifications()` runs
2. Hook calls `initSocket()` if not connected
3. Hook emits `join-doctor-notifications` event with doctorId
4. Backend socket handler joins doctor to `doctor-${doctorId}` and `notifications-${doctorId}` rooms
5. When patient books, backend creates Appointment and Notification documents
6. Backend emits `new-appointment` and `new-notification` socket events
7. Frontend hook receives `new-appointment` event
8. Shows toast, triggers browser notification (if permitted), bell updates
9. NotificationBell component listens for `new-notification` event
10. Fetches notifications from API and updates UI

---

## Browser Support

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (permission behavior varies)
- **Mobile Chrome/Firefox**: ✅ Full support

---

## Security Notes

1. Notifications only sent to authenticated doctors (JWT verified)
2. Socket events only emit to doctor's authenticated room
3. Notification API requires authentication (middleware: `protect`)
4. Browser permission is user-controlled, not forced
5. No sensitive data stored in browser notification text

---

## Future Enhancements

1. Sound notification on new appointment
2. Notification actions (quick "Accept" button)
3. Group notifications for bulk bookings
4. Notification history/archive
5. Notification preferences (on/off per appointment type)

---

## Support

For issues or questions:
1. Check console for errors (F12 → Console tab)
2. Verify backend is running
3. Check MongoDB connection
4. Verify Socket.IO connection in DevTools → Network → WS
5. Review logs in backend terminal
