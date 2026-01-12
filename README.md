# One Ops Dashboard

A comprehensive health monitoring dashboard for the Data Platform Team at Fox Corporation, providing end-to-end observability for all jobs across 7 major domains.

![Dashboard Type](https://img.shields.io/badge/Type-Analytics%20Dashboard-blue)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Databricks-green)

## 🎯 Overview

The One Ops Dashboard monitors job health and performance across:
- **AdSales**
- **AdTech**
- **Engagement**
- **Ratings**
- **MMM**
- **FoxOne**
- **Audience & Activation**

## ✨ Features

### 📊 Key Metrics
- **Job Status**: Real-time tracking of all jobs by status (Success/Failed/Running/Pending/Queued/Unknown)
- **Overrunning Jobs**: Automatic detection of jobs exceeding 1.5x average runtime
- **Active Incidents**: Critical issues requiring immediate attention

### 📈 Visualizations
- Platform-wise job status breakdown (DBT, Databricks, Airflow, Snowflake, DLT)
- Interactive bar charts with drill-down capabilities
- Comprehensive job listing with search and filter

### 🔔 Critical Bulletins
- Team-editable bulletin board for critical information
- Timestamp and user tracking
- Persistent storage across sessions

### 🎛️ Filters & Controls
- Date selection (defaults to current date)
- Domain-specific views
- Real-time refresh from Databricks
- Last refresh timestamp display

## 🚀 Quick Start

### Prerequisites
```bash
# Required
- Node.js v16+
- npm or yarn
- Databricks workspace access
- Personal access token
```

### Installation

1. **Clone and install frontend dependencies** (already done if you're reading this)
```bash
npm install
```

2. **Set up backend**
```bash
# Install backend dependencies
npm install express cors @databricks/sql dotenv
```

3. **Configure Databricks**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
DATABRICKS_HOST=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_TOKEN=your-personal-access-token
```

4. **Start the application**

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

5. **Access the dashboard**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Main application component
│   │   └── components/
│   │       ├── DashboardPage.tsx   # Dashboard layout
│   │       ├── KPICard.tsx         # KPI metric cards
│   │       ├── PlatformChart.tsx   # Platform status chart
│   │       ├── CriticalInfoBox.tsx # Bulletin board
│   │       ├── JobsTable.tsx       # Job listing table
│   │       └── FilterSidebar.tsx   # Date filter sidebar
│   ├── types/
│   │   └── dashboard.ts            # TypeScript interfaces
│   └── utils/
│       ├── api.ts                  # Backend API calls
│       └── metrics.ts              # Metrics calculations
├── server.js                       # Express backend server
├── .env.example                    # Environment template
└── SETUP_INSTRUCTIONS.md           # Detailed setup guide
```

## 🔌 API Endpoints

### `POST /api/dashboard/jobs`
Fetch jobs from Databricks for a specific date and domain.

**Request:**
```json
{
  "selectedDate": "2025-01-05",
  "domain": "mmm"  // optional
}
```

### `GET /api/bulletins`
Retrieve all critical bulletins.

### `POST /api/bulletins`
Create a new bulletin.

**Request:**
```json
{
  "bulletin": {
    "message": "Critical system update",
    "createdBy": "Data Ops Team"
  }
}
```

### `DELETE /api/bulletins/:id`
Delete a specific bulletin.

### `GET /api/health`
Backend health check.

## 🗃️ Database Schema

The dashboard reads from: `fox_bi_dev.dataops_dashboard.mmm_job_status_check`

**Key Columns:**
- `job_id`, `run_id`, `job_name`
- `job_platform` (databricks, dbt, airflow, snowflake, DLT)
- `job_status` (SUCCESS, FAILED, RUNNING, PENDING, QUEUED, UNKNOWN)
- `domain_name` (adsales, adtech, engagement, ratings, mmm, foxone, audience & activation)
- `duration_secs`, `avg_duration_secs` (for overrun detection)
- `job_start_time_utc`, `job_end_time_utc`

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for complete schema details.

## 🎨 User Interface

### Homepage (All Domains)
- Cumulative metrics across all 7 domains
- Platform distribution chart
- Critical information bulletins
- Complete job listing with search

### Domain Pages
- Domain-specific metrics and jobs
- Same layout as homepage, filtered by domain
- Accessible via tabs at the top

### Date Filter
- Click calendar icon in header
- Select specific date
- Auto-refresh data

### Refresh Button
- Manually trigger data refresh
- Shows last refresh timestamp
- Loading indicator during fetch

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABRICKS_HOST=your-host.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/warehouse-id
DATABRICKS_TOKEN=your-access-token
PORT=3001
```

**Frontend (.env - optional):**
```env
VITE_API_URL=http://localhost:3001
```

## 🧪 Development

### Frontend Development
```bash
npm run dev
```

### Backend Development (with auto-reload)
```bash
npm install -g nodemon
nodemon server.js
```

### Build for Production
```bash
npm run build
```

## 📝 Usage Guide

1. **View Overall Status**: Start on "All Domains" tab for cumulative view
2. **Check Specific Domain**: Click domain tab (e.g., "AdSales")
3. **Filter by Date**: Click calendar icon, select date
4. **Refresh Data**: Click "Refresh" button to fetch latest from Databricks
5. **Add Bulletin**: Click "+" in Critical Information box
6. **Search Jobs**: Use search box in jobs table

## 🔍 Overrunning Jobs Detection

Jobs are marked as "overrunning" when:
```
duration_secs > avg_duration_secs × 1.5
```

These are highlighted in red in the jobs table.

## 🚨 Troubleshooting

### Backend won't start
- Check Databricks credentials in `.env`
- Verify SQL Warehouse is running
- Check token hasn't expired

### No jobs showing
- Verify jobs exist for selected date
- Check Databricks table access
- Review backend console for errors

### Frontend can't connect
- Ensure backend is running on port 3001
- Check for CORS errors in browser console
- Verify `VITE_API_URL` if configured

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed troubleshooting.

## 🛣️ Roadmap

- [ ] JIRA integration for real incidents count
- [ ] User authentication & role-based access
- [ ] Email/Slack notifications for failures
- [ ] Historical trend analysis
- [ ] SLA tracking and alerts
- [ ] Customizable dashboards
- [ ] Export to PDF/Excel
- [ ] Real-time WebSocket updates

## 📄 License

Internal use - Fox Corporation

## 👥 Support

Contact the Data Platform Team for assistance.

---

**Built with ❤️ for the Fox Corporation Data Platform Team**
