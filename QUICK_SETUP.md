# Organization Authentication - Quick Setup Guide

## What Was Added

A complete organization login, registration, and management dashboard system similar to the admin portal but for organizations to manage their team members.

## Key URLs

| Purpose | URL |
|---------|-----|
| Login/Register | http://localhost:3000/org/login |
| Dashboard | http://localhost:3000/org/dashboard |
| API Base | http://localhost:5000/api/org-auth |

## Quick Test (No Coding Required)

### Step 1: Make sure you have an Organization
First, create or note down an existing Organization ID from MongoDB:
```bash
# Check existing organizations
db.Organizations.findOne()
# Note the _id value
```

### Step 2: Register via UI
1. Go to `http://localhost:3000/org/login?register=true`
2. Fill in:
   - Name: "John Doe"
   - Email: "john@hospital.com"
   - Password: "password123"
   - Phone: "+1234567890"
   - Organization ID: (paste the _id from step 1)
3. Click "Create Account"
4. You'll be redirected to dashboard

### Step 3: View Dashboard
- See statistics cards at the top
- View team members in table
- If you're ADMIN, click "Add User" to create more users

## API Endpoints Summary

### Public (No Auth Required)
```
POST /api/org-auth/register     → Register new user
POST /api/org-auth/login        → Login with email/password
```

### Protected (Auth Required)
```
GET  /api/org-auth/me                → Get current user
GET  /api/org-auth/users              → List users (ADMIN only)
POST /api/org-auth/users              → Create user (ADMIN only)
PUT  /api/org-auth/users/:id          → Update user (ADMIN or self)
DELETE /api/org-auth/users/:id        → Delete user (ADMIN only)
GET  /api/org-auth/dashboard-stats    → Get stats
```

## Test with cURL

### 1. Register
```bash
curl -X POST http://localhost:5000/api/org-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@org.com",
    "password": "test123",
    "organizationId": "YOUR_ORG_ID_HERE"
  }'
```

Response:
```json
{
  "message": "Registration successful",
  "token": "eyJ...",
  "user": { "name": "Test User", "email": "test@org.com", "role": "STAFF" },
  "organization": { "_id": "...", "name": "..." }
}
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/org-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@org.com",
    "password": "test123"
  }'
```

### 3. Get Dashboard Stats (Copy token from login response)
```bash
curl -X GET http://localhost:5000/api/org-auth/dashboard-stats \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN"
```

## File Changes Summary

### Created
- `Medi/models/OrganizationUser.js` - User model
- `Medi/routes/organizationAuth.js` - Auth routes
- `Medi/client/src/pages/organization/Login.jsx` - Login page
- `Medi/client/src/pages/organization/Dashboard.jsx` - Dashboard page
- `Medi/ORGANIZATION_AUTH.md` - Full documentation
- `Medi/IMPLEMENTATION_SUMMARY.md` - Implementation details
- `Medi/QUICK_SETUP.md` - This file

### Modified
- `Medi/server.js` - Added org-auth routes
- `Medi/client/src/App.jsx` - Added org routes
- `Medi/client/src/services/api.js` - Added orgAuthAPI

## Environment Setup

No new environment variables needed. Uses existing:
- `JWT_SECRET` - Token signing
- `MONGO_URI` - Database
- `PORT` - Server port

## Role-Based Features

### If User Role = ADMIN
✅ View all users
✅ Add new users
✅ Delete users
✅ Change user roles
✅ Deactivate/activate accounts

### If User Role = MANAGER or STAFF
✅ View profile
✅ Update own details
✅ View other users (read-only)
✗ Cannot create/modify/delete users

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Organization not found" | Check organizationId is valid |
| "Email already in use" | Use different email |
| "Invalid credentials" | Check email/password are correct |
| "No token provided" | Include Authorization header |
| "Admin access only" | User must be ADMIN role |
| Dashboard blank | Check browser console for errors |

## Testing Checklist

- [ ] Can register new user
- [ ] Can login with registered credentials
- [ ] Can see dashboard after login
- [ ] Can view statistics
- [ ] Can see team members (if ADMIN)
- [ ] Can add new users (if ADMIN)
- [ ] Can delete users (if ADMIN)
- [ ] Logout works and redirects to login
- [ ] Protected routes require authentication
- [ ] API returns correct status codes

## Next Steps

1. **Test the UI** at `http://localhost:3000/org/login`
2. **Try the API** with provided cURL commands
3. **Review documentation** in ORGANIZATION_AUTH.md
4. **Integrate with existing features** (optional)
5. **Add more features** as needed

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :5000

# Check MongoDB connection
# Verify MONGO_URI in .env
```

### Frontend shows errors
```bash
# Check browser console (F12)
# Verify API URL in .env or services/api.js
# Ensure backend is running
```

### Database issues
```bash
# Connect to MongoDB
mongosh

# Check collection exists
db.Organizations.findOne()

# Check OrganizationUsers collection
db.OrganizationUsers.findOne()
```

## Support Documents

- **Full API Docs**: See `ORGANIZATION_AUTH.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Architecture**: See backend code comments

## Ready to Use!

The organization authentication system is fully implemented and ready for:
- ✅ Local testing
- ✅ Integration testing
- ✅ Production deployment
- ✅ Further customization

Start by visiting `/org/login` and creating your first organization user!
