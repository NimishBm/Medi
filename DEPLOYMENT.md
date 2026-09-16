# ClinicFlow - Deployment Guide

## Deployment Options

Choose your preferred platform:

### Option 1: Docker (Recommended - Any Platform)
### Option 2: Heroku (Backend) + Vercel (Frontend)
### Option 3: AWS
### Option 4: DigitalOcean
### Option 5: Railway

---

## Option 1: Docker Deployment (All-in-One)

### Prerequisites
- Docker installed
- Docker Compose installed

### Step 1: Build Docker Images

```bash
cd ~/MediQueue

# Create Dockerfile for backend (already created)
# Create Dockerfile for client (already created)
# Create docker-compose.yml (already created)

# Update docker-compose.yml with your settings
```

### Step 2: Configure Environment

Edit `docker-compose.yml`:
```yaml
services:
  mongodb:
    # MongoDB will run in container
    
  server:
    environment:
      MONGO_URI: mongodb://admin:password123@mongodb:27017/clinicflow?authSource=admin
      JWT_SECRET: your_production_secret_key
      PORT: 5000
      NODE_ENV: production
      
  client:
    environment:
      VITE_API_URL: https://your-domain.com
      VITE_SOCKET_URL: https://your-domain.com
```

### Step 3: Build and Run

```bash
# Build all images
docker-compose build

# Run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 4: Access Application

```
Frontend: http://localhost:5173
API: http://localhost:5000
MongoDB: localhost:27017
```

---

## Option 2: Heroku + Vercel

### Backend Deployment (Heroku)

#### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- GitHub repository

#### Step 1: Create Heroku App

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create clinicflow-api

# Add MongoDB Atlas
heroku addons:create mongolab:sandbox
```

#### Step 2: Set Environment Variables

```bash
heroku config:set JWT_SECRET=your_production_secret
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://clinicflow.vercel.app
```

#### Step 3: Deploy

```bash
# Add Heroku remote
heroku git:remote -a clinicflow-api

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Frontend Deployment (Vercel)

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/clinicflow.git
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select GitHub repository
4. Select `client` as root directory
5. Set environment variables:
   ```
   VITE_API_URL=https://clinicflow-api.herokuapp.com
   VITE_SOCKET_URL=https://clinicflow-api.herokuapp.com
   ```
6. Click "Deploy"

#### Step 3: Configure Domain (Optional)

1. In Vercel dashboard, go to Settings
2. Add custom domain
3. Update DNS records according to Vercel instructions

---

## Option 3: AWS Deployment

### Elastic Beanstalk (Backend)

#### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

#### Step 2: Initialize EB

```bash
cd server
eb init -p "Node.js 18" clinicflow-api --region us-east-1
```

#### Step 3: Configure Environment

Create `server/.ebextensions/nodecommand.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
```

#### Step 4: Deploy

```bash
eb create clinicflow-env
eb deploy
```

### S3 + CloudFront (Frontend)

#### Step 1: Build

```bash
cd client
npm run build
```

#### Step 2: Create S3 Bucket

```bash
aws s3 mb s3://clinicflow-app --region us-east-1
```

#### Step 3: Upload Build

```bash
aws s3 sync dist/ s3://clinicflow-app/
```

#### Step 4: Create CloudFront Distribution

1. Go to CloudFront console
2. Create distribution
3. Set S3 bucket as origin
4. Set default root object to `index.html`

---

## Option 4: DigitalOcean App Platform

### Prerequisites
- DigitalOcean account
- GitHub repository

### Step 1: Connect GitHub

1. Go to DigitalOcean Dashboard
2. Click "Apps" → "Create App"
3. Connect GitHub repository
4. Select `MediQueue` repository

### Step 2: Configure Services

**Backend Service:**
- Source: `/server`
- Build command: `npm install`
- Run command: `npm start`
- HTTP Port: 5000
- Environment variables: (see below)

**Frontend Service:**
- Source: `/client`
- Build command: `npm run build`
- Output dir: `dist`
- HTTP Port: 3000

### Step 3: Set Environment Variables

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
NODE_ENV=production
VITE_API_URL=https://your-app.ondigitalocean.app
VITE_SOCKET_URL=https://your-app.ondigitalocean.app
```

### Step 4: Deploy

Click "Create App" and wait for deployment to complete.

---

## Option 5: Railway

### Prerequisites
- Railway account
- GitHub repository

### Step 1: Connect GitHub

1. Go to https://railway.app
2. Click "Create New Project"
3. Select "Deploy from GitHub repo"
4. Select `MediQueue` repository

### Step 2: Configure Services

**Database:**
- Add PostgreSQL or MongoDB from Railway marketplace
- Copy connection string

**Backend:**
- Add Node service pointing to `/server`
- Set environment variables

**Frontend:**
- Add Node service pointing to `/client`
- Set build command: `npm run build`

### Step 3: Environment Variables

In Railway dashboard, set for each service:

```
MONGO_URI=your_connection_string
JWT_SECRET=your_secret
NODE_ENV=production
VITE_API_URL=https://your-app.up.railway.app
VITE_SOCKET_URL=https://your-app.up.railway.app
```

### Step 4: Deploy

Push to GitHub and Railway will auto-deploy.

---

## Production Checklist

- [ ] Change all default passwords
- [ ] Update JWT_SECRET to a strong random string
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure CORS origins for production domain
- [ ] Setup database backups
- [ ] Configure logging and monitoring
- [ ] Test login and appointments flow
- [ ] Verify Socket.IO connection works
- [ ] Test queue updates in real-time
- [ ] Configure email notifications (optional)
- [ ] Setup monitoring/alerts
- [ ] Document production access procedures
- [ ] Create admin backup account
- [ ] Test disaster recovery procedures

---

## Production Environment Variables

### Server (.env)

```env
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=generate_strong_random_string
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com
```

### Client (.env.production)

```env
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=https://your-domain.com
```

---

## Performance Optimization

### Server Optimization

1. **Enable Gzip Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   app.use('/api/', limiter);
   ```

3. **Database Optimization**
   - Add indexes on frequently queried fields
   - Use connection pooling
   - Enable MongoDB compression

### Client Optimization

1. **Code Splitting**
   - Already implemented with React Router lazy loading

2. **Asset Optimization**
   - Minify CSS/JS
   - Optimize images
   - Use CDN for static assets

3. **Caching**
   - Set appropriate cache headers
   - Use service workers

---

## Monitoring & Logging

### Server Monitoring

```bash
# Using PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "clinicflow-api" -- start

# Monitor
pm2 monit

# View logs
pm2 logs clinicflow-api
```

### Error Tracking

```javascript
// Add Sentry for error tracking
const Sentry = require("@sentry/node");

Sentry.init({ dsn: process.env.SENTRY_DSN });

app.use(Sentry.Handlers.errorHandler());
```

### Application Logging

```javascript
// Morgan HTTP logger
const morgan = require('morgan');
app.use(morgan('combined'));
```

---

## Database Backups

### MongoDB Atlas Automated Backups

1. Go to MongoDB Atlas Console
2. Go to Cluster → Backup
3. Enable "Continuous Backups"
4. Set backup frequency

### Manual Backup

```bash
# Backup
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/clinicflow" --out ./backup

# Restore
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/clinicflow" ./backup/clinicflow
```

---

## SSL/HTTPS Configuration

### Using Let's Encrypt with Nginx

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Configure Nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5173;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**
   - Use load balancer (Nginx, HAProxy)
   - Run multiple server instances

2. **Database Replication**
   - MongoDB replica sets
   - Auto-failover enabled

3. **Session Management**
   - Store sessions in Redis
   - Distribute across servers

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Add caching layer (Redis)

---

## Troubleshooting Deployment Issues

### "Connection Refused"
- Verify server is running
- Check firewall settings
- Verify port is exposed

### "CORS Error"
- Update CLIENT_URL in server .env
- Verify CORS configuration

### "Socket Not Connecting"
- Check Socket.IO is properly configured
- Verify proxy settings
- Check firewall rules

### "Database Connection Failed"
- Verify connection string
- Check MongoDB is running
- Verify network access

---

## Support & Resources

- **Documentation**: See README.md and SETUP.md
- **Docker Docs**: https://docs.docker.com
- **Heroku Docs**: https://devcenter.heroku.com
- **Vercel Docs**: https://vercel.com/docs
- **AWS Docs**: https://docs.aws.amazon.com
- **DigitalOcean**: https://docs.digitalocean.com

Happy deploying! 🚀
