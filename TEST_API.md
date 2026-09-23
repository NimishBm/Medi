# Quick API Test

## Test the doctors endpoint directly:

### Using Browser DevTools:

1. Open DevTools (F12)
2. Go to Console tab
3. Paste this and run:

```javascript
fetch('/api/doctors')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(e => console.error('Error:', e))
```

You should see:
```json
{
  "doctors": [
    {
      "_id": "...",
      "name": "Dr. John",
      "specialization": "Cardiologist",
      "consultationFee": 500,
      "profilePhoto": null,
      "averageRating": 4.5,
      "totalReviews": 10,
      "experience": 5
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

If you see this, **the API is working correctly!**

---

## If it's not showing doctors:

### Option 1: Clear Cache & Hard Refresh
1. Press `Ctrl + Shift + Delete` (or Cmd + Shift + Delete on Mac)
2. Clear browsing data → Cache
3. Come back to the page
4. Hard refresh: `Ctrl + F5` (or Cmd + Shift + R on Mac)

### Option 2: Check Database
The database might not have any `isActive: true` doctors. Run in backend:

```bash
npm run server:dev
```

Then in another terminal, check MongoDB:
```bash
mongosh "your-mongodb-uri"
use clinicflow
db.Doctors.find({ isActive: true }).count()
```

If it returns 0, there are no active doctors in the database!

---

## If still showing "No doctors found":

1. Check browser DevTools → Network tab
2. Click on `/api/doctors` request
3. Go to Response tab
4. Should show the JSON above
5. If it's not there or empty, **the database is empty**

---

## To populate test data:

Run the seed script:
```bash
npm run seed
```

This will create test doctors in your database.
