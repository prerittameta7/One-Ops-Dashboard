# Troubleshooting Guide - One Ops Dashboard

## 🔍 Common Issues & Solutions

### 1. Backend Server Won't Start

#### Error: "Cannot find module 'express'"
**Cause**: Backend dependencies not installed

**Solution**:
```bash
npm install express cors @databricks/sql dotenv
```

#### Error: "DATABRICKS_HOST is not defined"
**Cause**: Missing .env file or incomplete configuration

**Solution**:
```bash
# Create .env file
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

#### Error: "Port 3001 already in use"
**Cause**: Another process is using port 3001

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or change port
# Change in server.js: const PORT = process.env.PORT || 3002;
```

### 2. Frontend Won't Start

#### Error: "Cannot GET /"
**Cause**: Frontend dev server not running

**Solution**:
```bash
# Make sure you're in project root
npm run dev
```

#### Error: Module not found
**Cause**: Frontend dependencies not installed

**Solution**:
```bash
npm install
```

### 3. No Data Showing in Dashboard

#### Symptom: Dashboard loads but shows 0 jobs
**Possible Causes & Solutions**:

**A. Databricks Not Configured**
```bash
# Check backend logs for connection errors
# Look for: "DATABRICKS_HOST: NOT CONFIGURED"

# Solution: Configure .env file
```

**B. No Jobs for Selected Date**
```bash
# Try different dates
# Check if table has data for that date in Databricks SQL Editor:
SELECT COUNT(*) 
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
WHERE DATE(job_start_time_utc) = '2025-01-05';
```

**C. Backend Not Running**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If fails, start backend:
node server.js
```

**D. CORS Error**
```bash
# Check browser console for CORS errors
# Solution: Ensure backend has CORS enabled (already in server.js)
```

### 4. Databricks Connection Issues

#### Error: "Connection timeout"
**Possible Causes**:
- SQL Warehouse is stopped
- Network connectivity issues
- Invalid host/path

**Solution**:
```bash
# 1. Check SQL Warehouse is running in Databricks
# 2. Verify credentials in .env:
echo $DATABRICKS_HOST
echo $DATABRICKS_HTTP_PATH

# 3. Test connection with simple query in Databricks SQL Editor
# 4. Check firewall/network settings
```

#### Error: "Authentication failed"
**Cause**: Invalid or expired access token

**Solution**:
```bash
# Generate new token:
# 1. Go to Databricks workspace
# 2. User Settings → Access Tokens
# 3. Generate New Token
# 4. Update .env file with new token
# 5. Restart backend server
```

#### Error: "Table or view not found"
**Cause**: Table name mismatch or insufficient permissions

**Solution**:
```sql
-- Verify table exists in Databricks:
SHOW TABLES IN fox_bi_dev.dataops_dashboard;

-- Check if you have access:
SELECT * FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check LIMIT 1;

-- If table name is different, update in server.js
```

### 5. Frontend Can't Connect to Backend

#### Symptom: Network errors in browser console
**Checks**:

```bash
# 1. Verify backend is running
curl http://localhost:3001/api/health

# 2. Check if URL is correct
# In browser console:
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(console.log)

# 3. Check for CORS errors in console
# If CORS error, verify backend has:
app.use(cors());
```

**Solution**:
```bash
# If backend on different port/host:
# Create .env in frontend root:
echo "VITE_API_URL=http://your-backend-host:port" > .env

# Restart frontend dev server
```

### 6. Bulletins Not Saving

#### Error: "Failed to save bulletin"
**Possible Causes**:

**A. File Permission Issue**
```bash
# Check if backend can write to directory
touch bulletins.json
chmod 666 bulletins.json
```

**B. Backend Error**
```bash
# Check backend console for errors
# Should see: "Bulletin saved successfully"
```

**C. Invalid JSON in bulletins.json**
```bash
# Validate JSON:
cat bulletins.json | jq .

# If invalid, fix or delete:
rm bulletins.json
# Backend will recreate on next save
```

### 7. Date Filter Not Working

#### Symptom: Changing date doesn't update data
**Debug Steps**:

```javascript
// 1. Open browser console
// 2. Check if date change triggers API call (Network tab)
// 3. Verify date format is correct

// 4. Test manually:
fetch('http://localhost:3001/api/dashboard/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ selectedDate: '2025-01-05' })
})
.then(r => r.json())
.then(console.log)
```

### 8. Overrunning Jobs Count is Wrong

#### Symptom: Overrunning count doesn't match expectations
**Verify Logic**:

```javascript
// In browser console, check job durations:
allJobs.forEach(job => {
  if (job.duration_secs && job.avg_duration_secs) {
    const isOverrunning = job.duration_secs > job.avg_duration_secs * 1.5;
    if (isOverrunning) {
      console.log(`${job.job_name}: ${job.duration_secs}s > ${job.avg_duration_secs * 1.5}s`);
    }
  }
});
```

**Check Database**:
```sql
-- In Databricks SQL Editor:
SELECT 
  job_name,
  duration_secs,
  avg_duration_secs,
  CASE 
    WHEN duration_secs > avg_duration_secs * 1.5 THEN 'OVERRUNNING'
    ELSE 'OK'
  END as status
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
WHERE DATE(job_start_time_utc) = '2025-01-05'
  AND duration_secs IS NOT NULL
  AND avg_duration_secs IS NOT NULL;
```

### 9. Chart Not Rendering

#### Symptom: Platform chart is blank or shows error
**Debug**:

```javascript
// In browser console:
console.log('Platform Metrics:', platformMetrics);

// Should show array like:
// [{ platform: 'databricks', success: 5, failed: 2, ... }]
```

**Verify Recharts**:
```bash
# Ensure recharts is installed
npm list recharts

# If missing:
npm install recharts
```

### 10. Jobs Table Shows Wrong Data

#### Symptom: Table shows jobs from wrong domain
**Check Filtering**:

```javascript
// In browser console:
console.log('Active Tab:', activeTab);
console.log('All Jobs:', allJobs.length);
console.log('Filtered Jobs:', currentJobs.length);

// Verify domain names match:
allJobs.forEach(job => console.log(job.domain_name));
```

**Case Sensitivity Issue**:
```javascript
// Domain filtering is case-insensitive
// But verify data consistency:
SELECT DISTINCT domain_name 
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check;

// Should match: adsales, adtech, engagement, ratings, mmm, foxone, audience & activation
```

## 🐛 Debugging Tools & Commands

### Backend Debugging

```bash
# Start with verbose logging
DEBUG=* node server.js

# Check if backend is responding
curl -v http://localhost:3001/api/health

# Test job endpoint
curl -X POST http://localhost:3001/api/dashboard/jobs \
  -H "Content-Type: application/json" \
  -d '{"selectedDate":"2025-01-05"}' | jq .

# Monitor backend logs in real-time
tail -f backend.log  # if you set up logging
```

### Frontend Debugging

```javascript
// In browser console:

// 1. Check current state
console.log('Selected Date:', selectedDate);
console.log('All Jobs:', allJobs);
console.log('Bulletins:', bulletins);
console.log('Active Tab:', activeTab);

// 2. Check API connection
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(data => console.log('Backend Health:', data));

// 3. Force refresh
handleRefresh();

// 4. Check metrics calculation
console.log('Metrics:', calculateMetrics(allJobs));
```

### Database Debugging

```sql
-- In Databricks SQL Editor:

-- 1. Check table structure
DESCRIBE fox_bi_dev.dataops_dashboard.mmm_job_status_check;

-- 2. Check data for today
SELECT * 
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
WHERE DATE(job_start_time_utc) = CURRENT_DATE()
LIMIT 10;

-- 3. Check domain distribution
SELECT domain_name, COUNT(*) as count
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
WHERE DATE(job_start_time_utc) = '2025-01-05'
GROUP BY domain_name;

-- 4. Check platform distribution
SELECT job_platform, job_status, COUNT(*) as count
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
WHERE DATE(job_start_time_utc) = '2025-01-05'
GROUP BY job_platform, job_status;
```

## 📋 Health Check Checklist

Run through this checklist when troubleshooting:

- [ ] **Backend Running**: `curl http://localhost:3001/api/health`
- [ ] **Frontend Running**: Browser shows dashboard at localhost:5173
- [ ] **.env Configured**: All required variables set
- [ ] **Databricks Connected**: Backend logs show "Token configured: YES"
- [ ] **SQL Warehouse Running**: Check in Databricks UI
- [ ] **Table Accessible**: Can query table in SQL Editor
- [ ] **Data Exists**: Table has rows for selected date
- [ ] **No CORS Errors**: Check browser console
- [ ] **No 404 Errors**: All API endpoints responding
- [ ] **Bulletins Saving**: Can add/delete bulletins

## 🔧 Environment Verification

### Verify Backend Environment

```bash
# Create a test script: test-env.js
cat > test-env.js << 'EOF'
require('dotenv').config();

console.log('Environment Check:');
console.log('✓ DATABRICKS_HOST:', process.env.DATABRICKS_HOST ? 'SET' : 'MISSING');
console.log('✓ DATABRICKS_HTTP_PATH:', process.env.DATABRICKS_HTTP_PATH ? 'SET' : 'MISSING');
console.log('✓ DATABRICKS_TOKEN:', process.env.DATABRICKS_TOKEN ? 'SET (hidden)' : 'MISSING');
console.log('✓ PORT:', process.env.PORT || '3001 (default)');
EOF

# Run it
node test-env.js
```

### Verify Frontend Build

```bash
# Build frontend
npm run build

# Preview production build
npm run preview

# If successful, production build is working
```

## 📞 Getting Help

### Collect Information Before Asking

```bash
# 1. Environment info
node --version
npm --version

# 2. Backend logs
# Copy last 50 lines from backend console

# 3. Browser console errors
# Take screenshot of browser console

# 4. API test results
curl -X POST http://localhost:3001/api/dashboard/jobs \
  -H "Content-Type: application/json" \
  -d '{"selectedDate":"2025-01-05"}'

# 5. Databricks test
# Try SELECT * FROM table LIMIT 1 in SQL Editor
```

### Where to Get Help

1. **SETUP_INSTRUCTIONS.md** - Setup details
2. **QUICK_REFERENCE.md** - Quick commands
3. **DEVELOPMENT_NOTES.md** - Architecture details
4. **Project Issues** - GitHub issues (if applicable)
5. **Data Platform Team** - Internal support

## 🚨 Emergency Recovery

### Nuclear Option: Complete Reset

```bash
# WARNING: This deletes all local data

# 1. Stop all servers (Ctrl+C)

# 2. Clean node_modules
rm -rf node_modules
rm package-lock.json

# 3. Clean bulletins
rm bulletins.json

# 4. Clean build artifacts
rm -rf dist

# 5. Reinstall everything
npm install
npm install express cors @databricks/sql dotenv

# 6. Reconfigure .env
cp .env.example .env
# Edit .env with credentials

# 7. Restart
# Terminal 1:
node server.js

# Terminal 2:
npm run dev
```

---

**Still having issues?** Document the error message, steps to reproduce, and environment details, then contact the Data Platform Team for support.
