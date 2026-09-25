# Organization Authentication - Deployment Checklist

## Pre-Deployment Testing

### Backend API Testing
- [ ] Register endpoint works with valid data
- [ ] Register returns 409 if email already exists
- [ ] Register returns 404 if organization doesn't exist
- [ ] Login endpoint works with valid credentials
- [ ] Login returns 401 with invalid password
- [ ] Login returns 401 if user account is inactive
- [ ] `/me` endpoint returns current user data
- [ ] `/users` list endpoint returns all users (admin only)
- [ ] `/users` list returns 403 for non-admin users
- [ ] `/users` create endpoint works (admin only)
- [ ] `/users/:id` delete endpoint works (admin only)
- [ ] `/users/:id` update endpoint works (admin or self)
- [ ] `/dashboard-stats` returns correct statistics
- [ ] Invalid tokens return 401 errors
- [ ] Expired tokens are rejected
- [ ] All endpoints with pagination handle limits correctly

### Frontend UI Testing
- [ ] Login page loads and displays correctly
- [ ] Registration page loads when using ?register=true
- [ ] Form validation works (empty fields show error)
- [ ] Password toggle shows/hides password
- [ ] Loading state shows during form submission
- [ ] Success notification shows after registration
- [ ] Success notification shows after login
- [ ] Error notifications show for failed requests
- [ ] User redirected to dashboard after login
- [ ] User redirected to login after logout
- [ ] Dashboard displays statistics correctly
- [ ] User table displays all users
- [ ] Admin can see "Add User" button
- [ ] Non-admin cannot see "Add User" button
- [ ] "Add User" form shows/hides correctly
- [ ] Add user form validation works
- [ ] Users can be deleted (admin only)
- [ ] Logout button works
- [ ] Protected routes redirect to login when not authenticated

### Security Testing
- [ ] Passwords are never logged or displayed
- [ ] Passwords are hashed in database (not plaintext)
- [ ] JWT tokens contain correct payload
- [ ] Expired tokens are rejected
- [ ] Invalid signatures are rejected
- [ ] ADMIN endpoints reject MANAGER/STAFF users
- [ ] Users cannot delete other users (unless admin)
- [ ] Users cannot modify other users (unless admin or self)
- [ ] Email must be unique (cannot register duplicate)
- [ ] Organization must exist (cannot register for fake org)
- [ ] CSRF attacks are prevented
- [ ] XSS attacks are prevented
- [ ] SQL injection is prevented (using Mongoose)

### Database Testing
- [ ] OrganizationUsers collection is created
- [ ] Email index is unique
- [ ] Compound index on organizationId + other fields works
- [ ] Passwords are stored hashed
- [ ] Timestamps are auto-generated
- [ ] Organizations reference is valid
- [ ] Role enum works correctly
- [ ] Active/inactive status works

### Integration Testing
- [ ] Organization routes don't conflict with admin routes
- [ ] Organization routes don't conflict with patient routes
- [ ] Organization routes don't conflict with doctor routes
- [ ] Auth middleware doesn't affect other routes
- [ ] CORS allows org-auth requests
- [ ] CORS allows browser origin

### Performance Testing
- [ ] Dashboard stats load in < 500ms
- [ ] User list loads in < 1 second
- [ ] Create user completes in < 500ms
- [ ] Delete user completes in < 500ms
- [ ] Concurrent requests work correctly
- [ ] Database indexes are used (not full scans)
- [ ] Memory usage is stable
- [ ] No N+1 query problems

### Deployment Testing
- [ ] Can build frontend without errors
- [ ] Can start backend server on production port
- [ ] Can start frontend dev server
- [ ] Environment variables are set correctly
- [ ] Database connection works in production
- [ ] JWT secret is strong (at least 32 characters)
- [ ] CORS is configured for production domain
- [ ] Error logging is configured
- [ ] Monitor alerts are set up

## Production Deployment Steps

### 1. Pre-Deployment Preparation
```bash
# Run tests
npm test

# Build frontend
npm run build

# Check for security vulnerabilities
npm audit

# Review changes
git diff HEAD~1
```

### 2. Database Migrations
```bash
# Ensure indexes are created
# This is automatic in Mongoose, but verify:
db.OrganizationUsers.getIndexes()

# Expected indexes:
# - _id (auto)
# - email (unique)
# - organizationId
```

### 3. Environment Configuration
```bash
# Verify .env has:
JWT_SECRET=<strong-random-secret>
MONGO_URI=<production-uri>
NODE_ENV=production
PORT=5000
CLIENT_URL=<your-domain>
```

### 4. Backend Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations if needed
npm run migrate

# Start server
npm start
# or with PM2
pm2 start server.js --name "clinic-api"

# Verify running
curl http://localhost:5000/api/health
```

### 5. Frontend Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Deploy dist folder to CDN/webserver
# Verify routes work
```

### 6. Verification
```bash
# Test registration
curl -X POST https://your-api.com/api/org-auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pwd123","organizationId":"valid-id"}'

# Test login
curl -X POST https://your-api.com/api/org-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pwd123"}'

# Test UI
open https://your-domain.com/org/login
```

### 7. Monitoring & Logging
```bash
# Check logs
tail -f /var/log/clinic-api.log

# Monitor performance
# Set up: Datadog, New Relic, or similar

# Configure alerts for:
- 401 Unauthorized spikes
- 500 errors
- Database connection failures
- High response times
- Failed registrations
- Failed logins
```

## Rollback Plan

If issues occur post-deployment:

```bash
# 1. Stop current deployment
pm2 stop clinic-api

# 2. Revert to previous version
git revert HEAD

# 3. Reinstall dependencies
npm install

# 4. Restart service
pm2 start server.js --name "clinic-api"

# 5. Verify service is running
curl http://localhost:5000/api/health

# 6. Notify team
# Send alert about rollback
```

## Post-Deployment Checklist

- [ ] All endpoints responding
- [ ] No error spikes in logs
- [ ] Database queries perform well
- [ ] Users can register successfully
- [ ] Users can login successfully
- [ ] Dashboard loads for authenticated users
- [ ] Admin functions work correctly
- [ ] Monitoring is collecting data
- [ ] Backups are running
- [ ] Team is notified of deployment

## Common Deployment Issues & Solutions

### Issue: "MONGO_URI is not defined"
**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify env variable is set
echo $MONGO_URI

# Set if missing
export MONGO_URI=<your-uri>
```

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
export PORT=5001
```

### Issue: "JWT_SECRET is too short"
**Solution:**
```bash
# Generate strong secret
openssl rand -base64 32

# Use as JWT_SECRET
export JWT_SECRET=<generated-value>
```

### Issue: "CORS error when accessing from frontend"
**Solution:**
```bash
# Update CORS configuration in server.js
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

# Restart server
```

### Issue: "Email already in use" error
**Solution:**
```bash
# Check for duplicate
db.OrganizationUsers.find({email: "test@test.com"})

# If found, delete or change email
db.OrganizationUsers.deleteOne({email: "test@test.com"})
```

## Maintenance Tasks

### Daily
- [ ] Monitor error logs
- [ ] Check response times
- [ ] Verify backup completion

### Weekly
- [ ] Review performance metrics
- [ ] Check security alerts
- [ ] Update dependencies if needed

### Monthly
- [ ] Review access logs
- [ ] Analyze user growth
- [ ] Plan future features
- [ ] Security audit

### Quarterly
- [ ] Review and update security policies
- [ ] Performance optimization review
- [ ] Database cleanup and optimization
- [ ] Load testing

## Feature Flags (For Future Use)

```javascript
// Use these to control rollout
const FEATURES = {
  ORG_AUTH_ENABLED: true,
  ADMIN_ONLY: false,
  BETA: true,
};

// In routes
if (!FEATURES.ORG_AUTH_ENABLED) {
  return res.status(503).json({ message: 'Feature disabled' });
}
```

## Documentation & Training

- [ ] Team trained on new system
- [ ] Documentation shared with team
- [ ] API documentation published
- [ ] Frontend usage guide created
- [ ] Administrator guide created
- [ ] Troubleshooting guide created
- [ ] Change log updated
- [ ] Video tutorial created (optional)

## Success Metrics

Track these after deployment:

| Metric | Target | Current |
|--------|--------|---------|
| Registration success rate | >95% | |
| Login success rate | >99% | |
| API response time | <200ms | |
| Dashboard load time | <1s | |
| Error rate | <0.1% | |
| Uptime | >99.9% | |
| User adoption | >80% | |

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

**Rollback Done:** Yes / No

**Status:** ✅ Successful / ❌ Needs Investigation

**Notes:** _________________________________________________________________

