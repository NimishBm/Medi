# Updated Organization Sign-Up Flow

## What Changed

The sign-up process is now much simpler and more flexible. Users can:

1. **Create a new organization** (become ADMIN automatically)
2. **Join an existing organization** (start as STAFF)

No need to have an organization pre-created!

## New Sign-Up Flow

### Option 1: Create New Organization ✨ (Recommended for first-time users)

```
User visits /org/login?register=true
          ↓
    Select: "Create new organization" ✓
          ↓
Fill in:
- Name (e.g., "John Doe")
- Email (e.g., "john@hospital.com")
- Password
- Phone (optional)
- Organization Name (e.g., "City Hospital")
          ↓
    Click "Create Account"
          ↓
System automatically:
- Creates the Organization
- Creates the OrganizationUser
- Sets user role as ADMIN
- Logs user in
          ↓
    Redirected to Dashboard ✓
```

### Option 2: Join Existing Organization

```
User visits /org/login?register=true
          ↓
    Uncheck: "Create new organization"
          ↓
Fill in:
- Name (e.g., "Jane Doe")
- Email (e.g., "jane@hospital.com")
- Password
- Phone (optional)
- Organization ID (provided by admin)
          ↓
    Click "Create Account"
          ↓
System:
- Finds existing organization
- Creates OrganizationUser
- Sets user role as STAFF
- Logs user in
          ↓
    Redirected to Dashboard ✓
```

## Database Changes

### Before
```
organizationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: true,  ← Had to exist
}
```

### After
```
organizationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: false,  ← Optional, auto-created if needed
}
```

## API Changes

### Register Endpoint

**Old Request:**
```json
{
  "name": "John Doe",
  "email": "john@hospital.com",
  "password": "pwd123",
  "organizationId": "required-existing-id"
}
```

**New Request (Create Organization):**
```json
{
  "name": "John Doe",
  "email": "john@hospital.com",
  "password": "pwd123",
  "isNewOrganization": true,
  "organizationName": "City Hospital"
}
```

**New Request (Join Organization):**
```json
{
  "name": "Jane Doe",
  "email": "jane@hospital.com",
  "password": "pwd123",
  "isNewOrganization": false,
  "organizationId": "existing-org-id"
}
```

## UI Changes

The sign-up form now has:
- ✅ Checkbox to toggle between "Create New" or "Join Existing"
- ✅ Dynamic fields that change based on selection
- ✅ Helper text explaining each option
- ✅ Better validation messages

### Create New Organization Form:
```
Name: [text input]
Email: [email input]
Password: [password input]
Phone: [tel input]
☑ Create new organization
Organization Name: [text input]
         "You'll be set as the ADMIN for this organization"
```

### Join Existing Organization Form:
```
Name: [text input]
Email: [email input]
Password: [password input]
Phone: [tel input]
☐ Create new organization
Organization ID: [text input]
         "Ask your organization admin for the organization ID"
```

## Automatic Role Assignment

### When Creating New Organization
- User role: **ADMIN** (automatic)
- Can manage all team members

### When Joining Existing Organization
- User role: **STAFF** (automatic)
- Can only view profile and team members
- Admin must promote to MANAGER or ADMIN

## Backend Logic

```javascript
router.post('/register', async (req, res) => {
  const { name, email, password, phone, organizationId, organizationName, isNewOrganization } = req.body;

  if (isNewOrganization && organizationName) {
    // Create new Organization
    const org = await Organization.create({
      name: organizationName,
      organizationId: organizationName.toLowerCase().replace(/\s+/g, '-'),
      type: 'HOSPITAL',
      isActive: true,
    });
    finalOrgId = org._id;
    userRole = 'ADMIN';
  } else if (organizationId) {
    // Use existing Organization
    const org = await Organization.findById(organizationId);
    if (!org) return error('Organization not found');
    finalOrgId = organizationId;
    userRole = 'STAFF';
  }

  // Create user with auto-assigned role
  const user = await OrganizationUser.create({
    name, email, password, phone,
    organizationId: finalOrgId,
    role: userRole,
    isActive: true,
  });
});
```

## Testing

### Test Creating New Organization
```bash
curl -X POST http://localhost:5000/api/org-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@hospital.com",
    "password": "password123",
    "isNewOrganization": true,
    "organizationName": "City Hospital"
  }'
```

Response:
```json
{
  "message": "Registration successful",
  "token": "eyJ...",
  "user": {
    "name": "John Doe",
    "email": "john@hospital.com",
    "role": "ADMIN",
    "organizationId": "..."
  },
  "organization": {
    "_id": "...",
    "name": "City Hospital"
  }
}
```

### Test Joining Existing Organization
```bash
curl -X POST http://localhost:5000/api/org-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@hospital.com",
    "password": "password123",
    "isNewOrganization": false,
    "organizationId": "EXISTING_ORG_ID"
  }'
```

## Usage Scenarios

### Scenario 1: Hospital Admin Signing Up First Time
1. Visit `/org/login?register=true`
2. Check "Create new organization"
3. Fill in name, email, password
4. Enter hospital name
5. Click "Create Account"
6. ✅ Now ADMIN of their organization

### Scenario 2: Doctor Joining Hospital
1. Get organization ID from hospital admin
2. Visit `/org/login?register=true`
3. Uncheck "Create new organization"
4. Fill in name, email, password
5. Paste organization ID
6. Click "Create Account"
7. ✅ Now STAFF member of hospital

### Scenario 3: Hospital Manager Adding New Staff
1. Admin logs in to `/org/dashboard`
2. Clicks "Add User"
3. Fills in staff member details
4. Selects role (MANAGER or STAFF)
5. Clicks "Create User"
6. ✅ Staff account created (can now login)

## Benefits of New Flow

✅ **Self-Service** - Users can create their organization without admin
✅ **Flexible** - Supports both new orgs and joining existing
✅ **Intuitive** - Clear toggle and explanatory text
✅ **Automatic** - Role assigned based on scenario
✅ **Less Friction** - No need for pre-created organizations
✅ **Scalable** - Works for enterprise and small organizations

## Migration Notes

If you have existing organizations:
- ✅ Existing flow still works
- ✅ Old organization IDs still valid
- ✅ No database migration needed
- ✅ Backward compatible

## Rollback (if needed)

To revert to old flow:
```javascript
// Make organizationId required again
organizationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: true,  ← Change back
}

// Remove new fields from API
// Remove toggle from UI
```

## Summary

| Feature | Before | After |
|---------|--------|-------|
| Create org during signup | ❌ No | ✅ Yes |
| Join existing org | ✅ Yes | ✅ Yes |
| Organization ID required | ✅ Always | ❌ Optional |
| Auto role assignment | ❌ No | ✅ Yes |
| User-friendly | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

**Updated:** 2026-09-24  
**Status:** ✅ Ready to Use
