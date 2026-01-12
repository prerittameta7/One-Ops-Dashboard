# One Ops Dashboard - Project Summary

## 📋 Project Overview

**Project Name**: One Ops Dashboard  
**Purpose**: Health monitoring dashboard for Data Platform Team at Fox Corporation  
**Tech Stack**: React + TypeScript + Node.js + Databricks  
**Status**: Ready for Development/Testing  

## 🎯 Business Requirements

### Domains Covered (7 Total)
1. AdSales
2. AdTech
3. Engagement
4. Ratings
5. MMM (Marketing Mix Modeling)
6. FoxOne
7. Audience & Activation

### Key Features Delivered
✅ **Real-time Job Monitoring** - Track all jobs across platforms  
✅ **Multi-Domain Support** - Cumulative and individual domain views  
✅ **Date Filtering** - Select specific date to view jobs  
✅ **Platform Analytics** - Visual breakdown by DBT, Databricks, Airflow, Snowflake, DLT  
✅ **Overrun Detection** - Auto-detect jobs exceeding 1.5x average runtime  
✅ **Critical Bulletins** - Team communication board for alerts  
✅ **Databricks Integration** - Direct connection to data warehouse  
✅ **Responsive Design** - Works on desktop, tablet, mobile  

## 🗂️ File Structure

```
one-ops-dashboard/
├── 📄 Documentation
│   ├── README.md                    # Main project README
│   ├── SETUP_INSTRUCTIONS.md        # Detailed setup guide
│   ├── DEVELOPMENT_NOTES.md         # Architecture & dev guide
│   ├── QUICK_REFERENCE.md           # Command reference
│   └── PROJECT_SUMMARY.md           # This file
│
├── 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx              # Main application
│   │   │   └── components/
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── KPICard.tsx
│   │   │       ├── PlatformChart.tsx
│   │   │       ├── CriticalInfoBox.tsx
│   │   │       ├── JobsTable.tsx
│   │   │       ├── FilterSidebar.tsx
│   │   │       └── ui/              # Shadcn components
│   │   ├── types/
│   │   │   └── dashboard.ts         # TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── api.ts               # Backend API calls
│   │   │   └── metrics.ts           # Business logic
│   │   └── styles/
│   │       └── ...
│   └── package.json                 # Frontend dependencies
│
├── 🔧 Backend (Node.js + Express)
│   ├── server.js                    # Express server
│   ├── backend-package.json         # Backend dependencies
│   ├── .env.example                 # Environment template
│   └── bulletins.json               # Bulletin storage (auto-created)
│
├── 📊 Data & Config
│   ├── mock-data.json               # Sample data for testing
│   └── .vscode/                     # VS Code configuration
│       ├── settings.json
│       └── launch.json
│
└── 🚀 Startup Scripts
    ├── start-dashboard.sh           # Linux/Mac startup
    └── start-dashboard.bat          # Windows startup
```

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Framework |
| TypeScript | Latest | Type safety |
| Tailwind CSS | 4.0 | Styling |
| Recharts | 2.15 | Charts & graphs |
| Radix UI | Latest | UI components |
| date-fns | 3.6 | Date formatting |
| Sonner | 2.0 | Toast notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 16+ | Runtime |
| Express | 4.19 | Web framework |
| @databricks/sql | 1.8 | Databricks connector |
| CORS | 2.8 | Cross-origin requests |
| dotenv | 16.4 | Environment config |

### Database
| Technology | Purpose |
|------------|---------|
| Databricks | Data warehouse |
| SQL Warehouse | Query execution |
| Table: `fox_bi_dev.dataops_dashboard.mmm_job_status_check` | Job data |

## 📊 Dashboard Features

### Homepage (All Domains)
```
┌─────────────────────────────────────────────────────┐
│  One Ops Dashboard Header                           │
│  [Date Filter] [Refresh Button] [Last Refresh]      │
├─────────────────────────────────────────────────────┤
│  [All Domains] [AdSales] [AdTech] ... [Tabs]        │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Job      │  │Overrun   │  │Incidents │          │
│  │ Status   │  │Jobs      │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────┐      │
│  │                     │  │ Critical Info   │      │
│  │  Platform Chart     │  │ Bulletin Board  │      │
│  │                     │  │                 │      │
│  └─────────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐      │
│  │  Jobs Table (Searchable, Sortable)        │      │
│  │  [Search: _______________]                │      │
│  │  ┌──────┬────────┬────────┬──────┐        │      │
│  │  │ Name │Platform│ Status │ ...  │        │      │
│  │  ├──────┼────────┼────────┼──────┤        │      │
│  │  │ ...  │  ...   │  ...   │ ...  │        │      │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Key Metrics (KPIs)

**1. Job Status**
- Total Jobs Count
- Breakdown: Success | Failed | Running
- Color-coded status badges

**2. Overrunning Jobs**
- Count of jobs exceeding 1.5x avg runtime
- Highlighted in red in table
- Shows duration vs average

**3. Active Incidents**
- Current: Placeholder (3)
- Future: JIRA integration
- Critical issues count

### Visualizations

**Platform Chart**
- Stacked bar chart
- X-axis: Platform (DBT, Databricks, Airflow, etc.)
- Y-axis: Job count
- Colors: Status-based (Green=Success, Red=Failed, etc.)

**Jobs Table**
- Columns: Job Name, Platform, Domain, Status, Start Time, Duration, Avg Duration, Pipeline, Datasource
- Search functionality
- Status badges
- Overrun highlighting (red text)
- Responsive design

### User Interactions

**Date Filter**
1. Click calendar icon in header
2. Select date from calendar
3. Dashboard auto-refreshes with new data

**Refresh Data**
1. Click "Refresh" button
2. Backend queries Databricks
3. Loading indicator shows
4. Toast notification on success

**Domain Navigation**
1. Click domain tab
2. Data filters client-side
3. Metrics recalculate
4. Table updates

**Add Bulletin**
1. Click "+" in Critical Info box
2. Enter message
3. Click "Save"
4. Appears in bulletin list

## 🔌 API Architecture

### Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/health` | GET | Health check | None |
| `/api/dashboard/jobs` | POST | Fetch jobs | None* |
| `/api/bulletins` | GET | Get bulletins | None* |
| `/api/bulletins` | POST | Add bulletin | None* |
| `/api/bulletins/:id` | DELETE | Delete bulletin | None* |

*Note: Authentication should be added for production

### Data Flow

```
┌──────────┐     HTTP      ┌──────────┐    SQL    ┌────────────┐
│          │─────────────→ │          │──────────→│            │
│  React   │               │  Express │           │ Databricks │
│ Frontend │               │  Backend │           │  Database  │
│          │←─────────────│          │←──────────│            │
└──────────┘     JSON      └──────────┘   Result  └────────────┘
```

## 🎨 Design System

### Colors
```
Success:   #10b981 (Green)
Failed:    #ef4444 (Red)
Running:   #3b82f6 (Blue)
Pending:   #eab308 (Yellow)
Queued:    #f97316 (Orange)
Unknown:   #6b7280 (Gray)
```

### Typography
- Headers: System default
- Body: System default
- Monospace: For IDs and codes

### Spacing
- Max content width: 1600px
- Padding: 24px (desktop), 16px (mobile)
- Card gap: 24px

## 📈 Business Logic

### Overrunning Detection
```javascript
if (duration_secs > avg_duration_secs * 1.5) {
  // Mark as overrunning
  // Highlight in red
  // Include in overrun count
}
```

### Domain Filtering
```javascript
// Case-insensitive matching
job.domain_name.toLowerCase() === selectedDomain.toLowerCase()
```

### Date Filtering (Backend)
```sql
WHERE DATE(job_start_time_utc) = '2025-01-05'
```

## 🔒 Security Considerations

### Current State (Development)
- ⚠️ No authentication
- ⚠️ No authorization
- ⚠️ SQL concatenation (injection risk)
- ✅ Environment variables for secrets
- ✅ Backend-only credential storage

### Required for Production
- [ ] User authentication (SSO/OAuth)
- [ ] Role-based access control
- [ ] Parameterized SQL queries
- [ ] Rate limiting
- [ ] HTTPS enforcement
- [ ] CSRF protection
- [ ] Audit logging
- [ ] Token rotation

## 🚀 Deployment Scenarios

### Scenario 1: Local Development
```bash
# Terminal 1: Backend
node server.js

# Terminal 2: Frontend
npm run dev
```

### Scenario 2: Production (Separate Services)
```bash
# Frontend: Vercel/Netlify
npm run build
# Deploy dist/ folder
# Set VITE_API_URL env var

# Backend: AWS/GCP/Azure
# Deploy server.js
# Set Databricks env vars
# Use PM2 or similar for process management
```

### Scenario 3: Docker
```bash
# Frontend
docker build -t one-ops-frontend .
docker run -p 5173:5173 one-ops-frontend

# Backend
docker build -t one-ops-backend -f Dockerfile.backend .
docker run -p 3001:3001 --env-file .env one-ops-backend
```

## 📊 Performance Metrics

### Target Performance
- Initial load: < 2 seconds
- Data refresh: < 1 second
- Table search: Real-time (no debounce needed for <1000 jobs)
- Chart rendering: < 500ms

### Current Optimizations
- Client-side filtering (no extra API calls)
- Calculated metrics cached per render
- Lazy tab loading (content only renders when active)

### Future Optimizations
- Virtual scrolling for 10,000+ jobs
- Backend pagination
- Redis caching layer
- WebSocket for real-time updates

## 🧪 Testing Checklist

### Functional Testing
- [ ] Load dashboard with current date
- [ ] Change date filter
- [ ] Switch between domain tabs
- [ ] Add/delete bulletins
- [ ] Search jobs
- [ ] Verify overrun highlighting
- [ ] Test refresh button
- [ ] Check responsive design

### Data Testing
- [ ] Jobs from multiple domains appear
- [ ] Metrics calculate correctly
- [ ] Platform chart shows all platforms
- [ ] Overrun detection works
- [ ] Date filter queries correct data

### Edge Cases
- [ ] No jobs for selected date
- [ ] Databricks connection failure
- [ ] Invalid date selection
- [ ] Very long job names
- [ ] 1000+ jobs in table

## 🛠️ Maintenance Tasks

### Daily
- Monitor backend logs for errors
- Check Databricks connection health
- Verify job data is updating

### Weekly
- Review bulletin history
- Check for stale bulletins
- Monitor API response times

### Monthly
- Rotate Databricks access token
- Review user feedback
- Update documentation
- Check for dependency updates

## 📞 Support Information

### Common Issues

**Issue**: No jobs showing  
**Solution**: Check date filter, verify Databricks table has data

**Issue**: Backend won't start  
**Solution**: Verify .env credentials, check SQL Warehouse status

**Issue**: Overrun count seems wrong  
**Solution**: Verify avg_duration_secs is populated in database

### Getting Help
1. Check QUICK_REFERENCE.md for commands
2. Review SETUP_INSTRUCTIONS.md for configuration
3. See DEVELOPMENT_NOTES.md for architecture details
4. Contact Data Platform Team

## 🎯 Success Criteria

✅ **Delivered**
- Dashboard displays job data from Databricks
- All 7 domains have dedicated views
- Date filtering works
- Overrun detection implemented
- Bulletin board functional
- Platform chart visualization
- Responsive design

⏳ **Pending** (Future Phases)
- JIRA integration for real incidents
- User authentication
- Email/Slack notifications
- Historical trend analysis
- Export functionality

## 📅 Roadmap

### Phase 1 (Current) - Core Dashboard ✅
- Basic monitoring
- Date filtering
- Domain views
- Platform analytics

### Phase 2 - JIRA Integration
- Real incidents count
- Incident details
- Linking jobs to incidents

### Phase 3 - Authentication
- SSO integration
- Role-based access
- Audit trail

### Phase 4 - Advanced Analytics
- Trend analysis
- Predictive alerts
- SLA tracking

### Phase 5 - Integrations
- Slack notifications
- Email alerts
- Webhook support

---

**Project Status**: ✅ Ready for Development & Testing  
**Last Updated**: January 5, 2026  
**Maintained By**: Data Platform Team, Fox Corporation  
**Contact**: [Your Contact Info]
