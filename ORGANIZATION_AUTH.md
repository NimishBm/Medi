# Organization Authentication & Dashboard System

This document describes the new organizational login, registration, and dashboard system for ClinicFlow. Similar to the admin portal, organization users can now manage their accounts and team members through a dedicated portal.

## Overview

The organization authentication system provides:
- **Registration & Login**: Organization users can create accounts and log in
- **User Management**: Admins can manage team members (create, update, delete)
- **Role-Based Access**: Users can have roles like ADMIN, MANAGER, or STAFF
- **Dashboard**: Organization-specific dashboard with statistics and user management
- **RESTful API**: Complete REST API for organization operations

## Architecture

### Backend

#### Models

**OrganizationUser** (`models/OrganizationUser.js`)
- Represents an organization user (e.g., hospital admin, staff member)
- Fields:
  - `name`: User's full name
  - `email`: Unique email address
  - `password`: Hashed password
  - `phone`: Optional phone number
  - `organizationId`: Reference to the parent Organization
  - `role`: User role (ADMIN, MANAGER, STAFF)
  - `isActive`: Account status
  - `permissions`: Array of permission strings
  - `timestamps`: Auto-created `createdAt` and `updatedAt`

#### Routes

**Organization Auth Routes** (`routes/organizationAuth.js`)

All routes are prefixed with `/api/org-auth` or `/org-auth`:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | No | Register a new organization user |
| POST | `/login` | No | Login with email and password |
| GET | `/me` | Yes | Get authenticated user's profile |
| GET | `/users` | Yes (ADMIN) | List all users in organization |
| POST | `/users` | Yes (ADMIN) | Create a new user |
| PUT | `/users/:id` | Yes (Admin or Self) | Update user details |
| DELETE | `/users/:id` | Yes (ADMIN) | Delete user |
| GET | `/dashboard-stats` | Yes | Get organization statistics |

### Frontend

#### Pages

**Organization Login** (`client/src/pages/organization/Login.jsx`)
- Unified login and registration page
- Toggle between login and registration modes
- Fields:
  - Login: Email, Password
  - Register: Name, Email, Password, Phone, Organization ID
- Stores token in Redux auth slice
- Redirects to `/org/dashboard` on success

**Organization Dashboard** (`client/src/pages/organization/Dashboard.jsx`)
- Shows organization statistics (total users, active users, roles breakdown)
- Lists all team members
- Admin-only features:
  - Add new users
  - Delete users
  - Manage user roles and status
- Displays user information:
  - Name, email, role, status, joined date
  - Actions (delete for admins)

#### API Service

**Organization Auth API** (`client/src/services/api.js` - `orgAuthAPI`)

```javascript
orgAuthAPI = {
  register: (data) => api.post('/org-auth/register', data),
  login: (data) => api.post('/org-auth/login', data),
  getMe: (token) => api.get('/org-auth/me', config),
  getUsers: (token) => api.get('/org-auth/users', config),
  createUser: (token, data) => api.post('/org-auth/users', data, config),
  updateUser: (token, id, data) => api.put(`/org-auth/users/${id}`, data, config),
  deleteUser: (token, id) => api.delete(`/org-auth/users/${id}`, config),
  getDashboardStats: (token) => api.get('/org-auth/dashboard-stats', config),
}
```

#### Routes

Added to App.jsx:
- `/org/login` - Login/Register page
- `/org/register` - Alias for login page (supports ?register=true query param)
- `/org/dashboard` - Organization dashboard (protected, requires ORG_USER role)

## Usage Guide

### For Organization Users

#### Registration
1. Navigate to `/org/login?register=true`
2. Fill in:
   - Name
   - Email
   - Password
   - Phone (optional)
   - Organization ID (provided by organization)
3. Click "Create Account"
4. Redirected to dashboard on success

#### Login
1. Navigate to `/org/login`
2. Enter email and password
3. Optionally select organization
4. Click "Sign In"
5. Redirected to dashboard on success

#### Dashboard
- View organization statistics
- View all team members (if admin)
- Add new users (if admin)
- Delete users (if admin)
- View user roles and status

### For Organization Admins

#### Adding Team Members
1. Go to Dashboard
2. Click "Add User"
3. Fill in member details:
   - Name
   - Email
   - Password
   - Phone (optional)
   - Role (STAFF, MANAGER, ADMIN)
4. Click "Create User"

#### Managing Users
- View all users in the Users table
- Delete users (click trash icon)
- Users appear with their role, status, and join date

#### Dashboard Statistics
View at a glance:
- Total team members
- Active vs. inactive users
- Role breakdown (Admins, Managers, Staff)

## API Examples

### Registration
```bash
curl -X POST http://localhost:5000/api/org-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@hospital.com",
    "password": "password123",
    "phone": "+1234567890",
    "organizationId": "60d5ec49c1234567890abcde",
    "role": "ADMIN"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/org-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@hospital.com",
    "password": "password123",
    "organizationId": "60d5ec49c1234567890abcde"
  }'
```

### Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/org-auth/dashboard-stats \
  -H "Authorization: Bearer <token>"
```

### Create User (Admin Only)
```bash
curl -X POST http://localhost:5000/api/org-auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@hospital.com",
    "password": "password456",
    "phone": "+9876543210",
    "role": "MANAGER"
  }'
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt
2. **JWT Authentication**: Token-based authentication with 7-day expiry
3. **Role-Based Access Control**: ADMIN, MANAGER, STAFF roles with different permissions
4. **Token Validation**: All protected routes require valid JWT token
5. **Email Uniqueness**: Ensures no duplicate email addresses
6. **Account Status**: Admin can deactivate user accounts

## Database Schema

### OrganizationUsers Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  organizationId: ObjectId (ref: Organization),
  role: String (enum: ['ADMIN', 'MANAGER', 'STAFF']),
  isActive: Boolean,
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Integration with Existing System

- **Organizations**: OrganizationUser belongs to an Organization
- **Admin System**: Similar to existing admin authentication (`/api/admin`)
- **Auth Slice**: Uses Redux auth slice with token and user storage
- **Protected Routes**: Uses existing ProtectedRoute component with role checking

## Future Enhancements

Potential improvements:
- Email verification for new registrations
- Password reset functionality
- Audit logs for admin actions
- Permission customization per role
- Two-factor authentication
- Session management
- Organization settings management
- Activity reports
- Integration with organization doctors

## Troubleshooting

### Login fails with "Invalid credentials"
- Verify email and password are correct
- Ensure user exists in the organization
- Check if account is active (not deactivated)

### "No token provided" error
- Ensure Bearer token is in Authorization header
- Check if token has expired (7 days)
- Login again to get a new token

### Cannot add users as admin
- Verify you have ADMIN role
- Check if user email already exists
- Ensure all required fields are filled

## Files Modified/Created

### Created Files
- `models/OrganizationUser.js` - Organization user model
- `routes/organizationAuth.js` - Organization auth routes
- `client/src/pages/organization/Login.jsx` - Login/register page
- `client/src/pages/organization/Dashboard.jsx` - Dashboard page
- `ORGANIZATION_AUTH.md` - This documentation

### Modified Files
- `server.js` - Added organizationAuth route import and middleware
- `client/src/services/api.js` - Added orgAuthAPI
- `client/src/App.jsx` - Added organization routes

## Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - For token generation/verification
- `MONGO_URI` - Database connection
- `PORT` - Server port
