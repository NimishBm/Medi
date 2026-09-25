# Organization Authentication - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐      ┌─────────────────────────┐   │
│  │  Login/Register Page    │      │   Dashboard Page        │   │
│  │  (/org/login)           │      │   (/org/dashboard)      │   │
│  │                         │      │                         │   │
│  │ • Email input           │  ──> │ • Statistics            │   │
│  │ • Password input        │      │ • User list             │   │
│  │ • Name/Phone (reg)      │      │ • Add user (admin)      │   │
│  │ • Org ID (reg)          │      │ • Delete user (admin)   │   │
│  └────────────┬────────────┘      └────────────▲────────────┘   │
│               │                                 │                 │
│               │ POST /org-auth/register    GET /org-auth/users   │
│               │ POST /org-auth/login       POST /org-auth/users  │
│               │                            DELETE /org-auth/users │
│               │                            GET /org-auth/stats    │
│               └────────────┬─────────────────┬──────────────────┘│
│                            │                 │                    │
│                   Redux Auth Slice stores token & user             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP Requests with JWT Token
                             │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express/Node.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │     Organization Auth Routes (organizationAuth.js)       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │ POST /register          (public)                          │   │
│  │   └─> Create OrganizationUser                            │   │
│  │   └─> Hash password with bcrypt                          │   │
│  │   └─> Return JWT token                                   │   │
│  │                                                           │   │
│  │ POST /login             (public)                          │   │
│  │   └─> Find user by email                                 │   │
│  │   └─> Compare password                                   │   │
│  │   └─> Generate JWT token                                 │   │
│  │                                                           │   │
│  │ GET /me                 (protected)                       │   │
│  │   └─> Return current user info                           │   │
│  │                                                           │   │
│  │ GET /users              (admin only)                      │   │
│  │   └─> List all org users                                 │   │
│  │                                                           │   │
│  │ POST /users             (admin only)                      │   │
│  │   └─> Create new user in organization                    │   │
│  │                                                           │   │
│  │ PUT /users/:id          (admin or self)                   │   │
│  │   └─> Update user details                                │   │
│  │                                                           │   │
│  │ DELETE /users/:id       (admin only)                      │   │
│  │   └─> Delete user from organization                      │   │
│  │                                                           │   │
│  │ GET /dashboard-stats    (protected)                       │   │
│  │   └─> Return org statistics                              │   │
│  │                                                           │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                         │
│                         │ Query/Modify Database                   │
│                         ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       OrganizationUser Model (Mongoose Schema)           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │ • name: String                                            │   │
│  │ • email: String (unique)                                  │   │
│  │ • password: String (hashed)                               │   │
│  │ • phone: String                                           │   │
│  │ • organizationId: ObjectId (ref)                          │   │
│  │ • role: String (ADMIN|MANAGER|STAFF)                      │   │
│  │ • isActive: Boolean                                       │   │
│  │ • permissions: [String]                                   │   │
│  │ • timestamps: createdAt, updatedAt                        │   │
│  │                                                           │   │
│  │ Methods:                                                  │   │
│  │ • comparePassword()  - bcrypt comparison                  │   │
│  │ • toJSON()          - exclude password                    │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                         │
│                         │ Connect to                              │
│                         ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            MongoDB Collections                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │ OrganizationUsers (new)                                   │   │
│  │   └─> Stores org user accounts and credentials            │   │
│  │                                                           │   │
│  │ Organizations (existing)                                  │   │
│  │   └─> Links to parent organization                        │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Registration Flow
```
User visits /org/login?register=true
          │
          ▼
┌─────────────────────────┐
│ Enter Registration Info │
│ • Name                  │
│ • Email                 │
│ • Password              │
│ • Organization ID       │
└────────────┬────────────┘
             │
             ▼
    POST /org-auth/register
             │
             ▼
    ┌───────────────────┐
    │ Backend validates │
    │ • Email unique?   │
    │ • Org exists?     │
    │ • Fields valid?   │
    └────────┬──────────┘
             │
        Yes  │  No
             │  └──> Return 400 error
             │
             ▼
    Hash password with bcrypt
             │
             ▼
    Create OrganizationUser
             │
             ▼
    Generate JWT token
    (7-day expiry)
             │
             ▼
    Return token + user data
             │
             ▼
    ┌──────────────────────┐
    │ Frontend stores:     │
    │ • token (localStorage│
    │ • user (Redux)       │
    └────────┬─────────────┘
             │
             ▼
    Redirect to /org/dashboard
             │
             ▼
    ✅ Registration Complete
```

### Login Flow
```
User visits /org/login
          │
          ▼
┌─────────────────────────┐
│ Enter Login Info        │
│ • Email                 │
│ • Password              │
│ • Organization (opt)    │
└────────────┬────────────┘
             │
             ▼
    POST /org-auth/login
             │
             ▼
    ┌───────────────────┐
    │ Backend validates │
    │ • User exists?    │
    │ • Password match? │
    │ • Account active? │
    └────────┬──────────┘
             │
        Yes  │  No
             │  └──> Return 401 error
             │
             ▼
    Generate JWT token
    (7-day expiry)
             │
             ▼
    Return token + user data
             │
             ▼
    ┌──────────────────────┐
    │ Frontend stores:     │
    │ • token (localStorage│
    │ • user (Redux)       │
    └────────┬─────────────┘
             │
             ▼
    Redirect to /org/dashboard
             │
             ▼
    ✅ Login Complete
```

### Protected Route Flow
```
User tries to access /org/dashboard
             │
             ▼
    Check Redux auth state
             │
        Has token?
        │     │
       Yes    No
        │     └──> Redirect to /org/login
        │
        ▼
    ProtectedRoute component checks role
             │
    Role = ORG_USER?
        │     │
       Yes    No
        │     └──> Redirect to /org/login
        │
        ▼
    GET /org-auth/dashboard-stats
             │
             │ (Include token in header)
             │ Authorization: Bearer TOKEN
             ▼
    Backend validates token (JWT verify)
             │
        Valid?
        │     │
       Yes    No
        │     └──> Return 401 error
        │
        ▼
    Return dashboard statistics
             │
             ▼
    Display dashboard with data
             │
             ▼
    ✅ Access Granted
```

## Role-Based Access Control (RBAC)

```
                    ┌──────────────────────┐
                    │   Organization       │
                    │   (Parent Entity)     │
                    └──────────┬───────────┘
                               │
                    OrganizationId Reference
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
        ┌────────┐        ┌────────┐        ┌────────┐
        │ ADMIN  │        │MANAGER │        │ STAFF  │
        └────────┘        └────────┘        └────────┘
            │                  │                  │
            │                  │                  │
    ✅ Create users       ✅ View users    ✅ View profile
    ✅ Delete users       ✅ View stats    ✅ Update self
    ✅ Update users       ✅ View self     ✅ View others
    ✅ Change roles       ✅ Update self       (read-only)
    ✅ Deactivate users
    ✅ View all stats
    ✅ Full control
```

## Database Relationships

```
┌────────────────────────────────┐
│     Organization               │
├────────────────────────────────┤
│ _id                            │
│ name                           │
│ organizationId (unique)        │
│ type                           │
│ ...                            │
└─────────────────┬──────────────┘
                  │ One-to-Many
                  │ organizationId
                  │
                  ▼
┌────────────────────────────────┐
│     OrganizationUser (NEW)     │
├────────────────────────────────┤
│ _id                            │
│ name                           │
│ email (unique)                 │
│ password (hashed)              │
│ phone                          │
│ organizationId (foreign key)   │
│ role (ADMIN|MANAGER|STAFF)     │
│ isActive                       │
│ permissions: []                │
│ createdAt                      │
│ updatedAt                      │
└────────────────────────────────┘
```

## API Response Examples

### Register Success
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@hospital.com",
    "phone": "+1234567890",
    "role": "ADMIN",
    "isActive": true,
    "organizationId": "507f1f77bcf86cd799439012"
  },
  "organization": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "City Hospital",
    "type": "HOSPITAL"
  }
}
```

### Dashboard Stats Success
```json
{
  "totalUsers": 15,
  "activeUsers": 14,
  "inactiveUsers": 1,
  "adminUsers": 2,
  "managerUsers": 3,
  "staffUsers": 10
}
```

### Error Response
```json
{
  "message": "Email already in use"
}
```

## Security Features

```
┌────────────────────────────────────────┐
│      Security Layer 1: Input           │
├────────────────────────────────────────┤
│ • Validate email format                │
│ • Check password length                │
│ • Trim whitespace                      │
│ • Required field checks                │
└────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│      Security Layer 2: Database        │
├────────────────────────────────────────┤
│ • Email unique constraint               │
│ • Mongoose validation                   │
│ • Type checking                         │
└────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│    Security Layer 3: Cryptography      │
├────────────────────────────────────────┤
│ • bcrypt password hashing               │
│   (10 salt rounds)                      │
│ • JWT token signing                     │
│   (HS256 algorithm)                     │
└────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│   Security Layer 4: Authentication     │
├────────────────────────────────────────┤
│ • JWT token verification                │
│ • Token expiry check (7 days)           │
│ • Bearer token extraction               │
└────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│    Security Layer 5: Authorization     │
├────────────────────────────────────────┤
│ • Role-based access control (RBAC)     │
│ • Ownership check (user can edit self)  │
│ • Admin-only route checks               │
└────────────────────────────────────────┘
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                  JWT Token Lifecycle                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Generated at:    Login/Register                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Token Payload:                                     │ │
│  │ {                                                  │ │
│  │   "id": "user_id",                                 │ │
│  │   "role": "ADMIN|MANAGER|STAFF",                   │ │
│  │   "organizationId": "org_id",                      │ │
│  │   "email": "user@org.com"                          │ │
│  │ }                                                  │ │
│  │                                                    │ │
│  │ Signed with: JWT_SECRET (server-side)              │ │
│  │ Expiry: 7 days from generation                      │ │
│  └────────────────────────────────────────────────────┘ │
│         │                                                 │
│         ▼                                                 │
│  Stored by: Browser localStorage                         │
│  Sent with: Authorization: Bearer TOKEN                  │
│         │                                                 │
│         ▼                                                 │
│  Used for: API request authentication                    │
│         │                                                 │
│         ▼                                                 │
│  Expires: After 7 days                                   │
│  Action: User must login again                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Logout manually:                                   │ │
│  │ • Clear localStorage                               │ │
│  │ • Clear Redux auth state                           │ │
│  │ • Redirect to login                                │ │
│  │                                                    │ │
│  │ Automatic expiry:                                  │ │
│  │ • Backend rejects token                            │ │
│  │ • Frontend detects 401 error                       │ │
│  │ • Redirect to login                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Request/Response Cycle

```
┌─────────────────────────────────────────────────────┐
│              Complete Request Cycle                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. Frontend (React)                                 │
│    └─> Calls orgAuthAPI.getUsers(token)             │
│                                                     │
│ 2. API Service (axios)                              │
│    └─> Adds Authorization header                    │
│    └─> Sets BaseURL to /api                         │
│    └─> Sends: GET /api/org-auth/users               │
│                                                     │
│ 3. Backend (Express)                                │
│    ├─> Route: GET /org-auth/users                   │
│    ├─> Middleware: requireOrgUser                   │
│    │   └─> Verify JWT token valid                   │
│    │   └─> Extract user info from token             │
│    ├─> Middleware: requireOrgAdmin                  │
│    │   └─> Check user.role === 'ADMIN'              │
│    ├─> Controller Logic                             │
│    │   └─> Query: OrganizationUser.find({           │
│    │         organizationId: req.user.organizationId │
│    │       })                                        │
│    │   └─> Sort by createdAt                         │
│    │   └─> Exclude password                          │
│    │   └─> Return users array                        │
│    └─> Send Response 200 with users                 │
│                                                     │
│ 4. Frontend (React)                                 │
│    ├─> Receive response.data                        │
│    ├─> setUsers(response.data.users)                │
│    ├─> Render users table                           │
│    └─> Display success notification                 │
│                                                     │
│ Error Handling (if step fails):                     │
│    ├─> Invalid token → 401 Unauthorized             │
│    ├─> Not ADMIN → 403 Forbidden                    │
│    ├─> Server error → 500 Internal Error            │
│    └─> Frontend catches → Shows toast error         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

This architecture provides a secure, scalable system for organization user management with clear separation of concerns between frontend and backend.
