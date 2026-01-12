# Quick Reference - One Ops Dashboard

## 🚀 Quick Start Commands

```bash
# Start Backend
node server.js

# Start Frontend
npm run dev

# Install Backend Dependencies
npm install express cors @databricks/sql dotenv

# Build for Production
npm run build
```

## 🔑 Environment Variables

Create `.env` file:
```env
DATABRICKS_HOST=your-host.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-id
DATABRICKS_TOKEN=your-token
PORT=3001
```

## 📊 Database Query Format

The backend queries this table:
```sql
SELECT * 
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
WHERE DATE(job_start_time_utc) = '2025-01-05'
ORDER BY job_start_time_utc DESC
```

## 🎯 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/dashboard/jobs` | Fetch jobs from Databricks |
| GET | `/api/bulletins` | Get critical bulletins |
| POST | `/api/bulletins` | Add new bulletin |
| DELETE | `/api/bulletins/:id` | Delete bulletin |
| GET | `/api/health` | Check backend status |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `server.js` | Backend server |
| `src/app/App.tsx` | Main frontend app |
| `src/types/dashboard.ts` | TypeScript interfaces |
| `src/utils/metrics.ts` | Metrics calculations |
| `.env` | Databricks credentials |
| `bulletins.json` | Stored bulletins |

## 🎨 Domain Names (Case Insensitive)

1. adsales
2. adtech
3. engagement
4. ratings
5. mmm
6. foxone
7. audience & activation

## 🏷️ Job Status Values

- SUCCESS
- FAILED
- RUNNING
- PENDING
- QUEUED
- UNKNOWN

## 🔧 Platform Names

- databricks
- dbt
- airflow
- snowflake
- DLT

## 📐 Metrics Logic

### Overrunning Jobs
```javascript
duration_secs > avg_duration_secs * 1.5
```

### Active Incidents
Currently: Hardcoded placeholder (3)
Future: From JIRA integration

## 🎯 Common Tasks

### Change Default Date
```typescript
// src/app/App.tsx
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
```

### Add New Domain
```typescript
// src/types/dashboard.ts
export const DOMAINS = [
  'AdSales',
  'AdTech',
  'YourNewDomain', // Add here
] as const;
```

### Modify Overrun Threshold
```typescript
// src/utils/metrics.ts
if (job.duration_secs > job.avg_duration_secs * 1.5) {
  // Change 1.5 to your threshold
}
```

### Change Table Name
```javascript
// server.js
FROM fox_bi_dev.dataops_dashboard.mmm_job_status_check
// Change to your table
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check dependencies
npm install express cors @databricks/sql dotenv

# Verify .env exists
ls -la .env

# Test with mock credentials
echo "DATABRICKS_HOST=test" >> .env
```

### Frontend can't connect
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Check console for errors
# Browser DevTools → Console

# Verify CORS
# Backend should log: CORS enabled
```

### No data showing
```bash
# Check backend logs for errors
# Verify table name matches
# Test query in Databricks SQL Editor
# Check date format: YYYY-MM-DD
```

### Databricks connection fails
```bash
# Verify credentials in .env
# Check SQL Warehouse is running
# Test with Databricks CLI
# Ensure token hasn't expired
```

## 📊 Sample API Requests

### Fetch Jobs
```bash
curl -X POST http://localhost:3001/api/dashboard/jobs \
  -H "Content-Type: application/json" \
  -d '{"selectedDate":"2025-01-05","domain":"mmm"}'
```

### Add Bulletin
```bash
curl -X POST http://localhost:3001/api/bulletins \
  -H "Content-Type: application/json" \
  -d '{
    "bulletin": {
      "message": "System maintenance at 10 AM",
      "createdBy": "DevOps Team"
    }
  }'
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

## 🎨 Color Codes

### Status Colors
```css
SUCCESS:  text-green-600, bg-green-100
FAILED:   text-red-600, bg-red-100
RUNNING:  text-blue-600, bg-blue-100
PENDING:  text-yellow-600, bg-yellow-100
QUEUED:   text-orange-600, bg-orange-100
UNKNOWN:  text-gray-600, bg-gray-100
```

### KPI Icon Colors
```css
Job Status:       text-blue-600
Overrunning Jobs: text-orange-600
Incidents:        text-red-600
```

## 🔍 Useful Console Commands

### Check loaded jobs count
```javascript
// Browser Console
console.log(allJobs.length)
```

### View current metrics
```javascript
// Browser Console
console.log(metrics)
```

### Test API connection
```javascript
// Browser Console
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(console.log)
```

## 📱 Responsive Breakpoints

```css
sm:  640px  (Tailwind sm:)
md:  768px  (Tailwind md:)
lg:  1024px (Tailwind lg:)
xl:  1280px (Tailwind xl:)
```

## 🎯 Port Configuration

| Service | Default Port |
|---------|--------------|
| Backend | 3001 |
| Frontend (dev) | 5173 |
| Frontend (preview) | 4173 |

## 📝 Date Formats

| Context | Format | Example |
|---------|--------|---------|
| API Query | yyyy-MM-dd | 2025-01-05 |
| Display | MMM dd, yyyy | Jan 05, 2025 |
| Timestamp | MMM dd, yyyy HH:mm:ss | Jan 05, 2025 10:30:45 |
| Bulletin | MMM dd, yyyy HH:mm | Jan 05, 2025 10:30 |

## 🔐 Production Checklist

- [ ] Update CORS origin to production domain
- [ ] Rotate Databricks access token
- [ ] Set up HTTPS
- [ ] Configure environment variables
- [ ] Enable authentication
- [ ] Add rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure backup for bulletins
- [ ] Test with production data
- [ ] Document API endpoints

---

**Quick Help**: Check SETUP_INSTRUCTIONS.md for detailed setup
**Detailed Docs**: See DEVELOPMENT_NOTES.md for architecture
