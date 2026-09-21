# Photo Upload Feature - Implementation Summary

## Changes Made:

### 1. **Database Schema** (`server/src/models/User.js`)
- Added `profilePhoto` field (String, default: null) to store the photo URL

### 2. **Backend Routes** (`server/src/routes/doctors.js`)
- Added `multer` configuration for file uploads
- Configured upload directory: `/uploads/doctors`
- File size limit: 5MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Created new endpoint: `POST /api/doctors/upload-photo`
- Updated `/api/doctors/me` PUT endpoint to include all new profile fields

### 3. **Server Setup** (`server/src/index.js`)
- Added static file serving for uploaded images
- Configured `/uploads` route to serve static files

### 4. **Frontend Profile Page** (`client/src/pages/doctor/Profile.jsx`)
- Added photo upload UI with camera icon on profile avatar
- Photos display in the avatar section when uploaded
- Upload button appears on hover in edit mode
- File validation (type and size)
- Loading state during upload
- Success/error toast notifications
- Photo preview in both edit and view modes

## How to Use:

1. Doctor clicks "Edit Profile"
2. Hovers over the profile avatar
3. Camera icon appears at the bottom right
4. Clicks to select an image file
5. Image uploads automatically
6. Profile photo updates in real-time
7. Photo persists in database

## API Endpoints:

### Upload Photo
```
POST /api/doctors/upload-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: { profilePhoto: File }

Response: {
  message: "Photo uploaded successfully",
  profilePhoto: "/uploads/doctors/filename.jpg",
  user: { ...userData }
}
```

### Update Profile
```
PUT /api/doctors/me
Authorization: Bearer {token}
Body: { ...profileFields }
```

## File Storage:
- Location: `server/uploads/doctors/`
- Naming: `doctor-{userId}-{timestamp}.{ext}`
- Accessible at: `http://localhost:5000/uploads/doctors/{filename}`

## Features:
✅ Image validation (type and size)
✅ Real-time preview
✅ Error handling
✅ Success notifications
✅ Database persistence
✅ Responsive design
✅ Loading states
