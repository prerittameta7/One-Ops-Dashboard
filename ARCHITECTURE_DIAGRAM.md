# One Ops Dashboard - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    React Frontend (Port 5173)               │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │   Tabs   │  │  Header  │  │ Filters  │  │  Toasts  │   │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │    │
│  │                                                              │    │
│  │  ┌───────────────────────────────────────────────────────┐ │    │
│  │  │           DashboardPage (per domain)                   │ │    │
│  │  │                                                         │ │    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                 │ │    │
│  │  │  │ KPI #1  │ │ KPI #2  │ │ KPI #3  │                 │ │    │
│  │  │  └─────────┘ └─────────┘ └─────────┘                 │ │    │
│  │  │                                                         │ │    │
│  │  │  ┌───────────────────┐  ┌────────────────┐            │ │    │
│  │  │  │ Platform Chart    │  │ Critical Info  │            │ │    │
│  │  │  │ (Recharts)        │  │ Bulletin Board │            │ │    │
│  │  │  └───────────────────┘  └────────────────┘            │ │    │
│  │  │                                                         │ │    │
│  │  │  ┌──────────────────────────────────────────────────┐ │ │    │
│  │  │  │        Jobs Table (Searchable)                   │ │ │    │
│  │  │  └──────────────────────────────────────────────────┘ │ │    │
│  │  └───────────────────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                │                                      │
│                                │ HTTP/REST API                        │
│                                ▼                                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼──────────────────────────────────┐
│                   Express Backend (Port 3001)                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    API Endpoints                              │ │
│  │                                                                │ │
│  │  POST   /api/dashboard/jobs    ──┐                           │ │
│  │  GET    /api/bulletins          ──┤                           │ │
│  │  POST   /api/bulletins          ──┤  Express Routes           │ │
│  │  DELETE /api/bulletins/:id      ──┤                           │ │
│  │  GET    /api/health             ──┘                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────┐         ┌──────────────────────────┐   │
│  │  Databricks Client   │         │   File System (JSON)     │   │
│  │  (@databricks/sql)   │         │   bulletins.json         │   │
│  └──────────┬───────────┘         └──────────────────────────┘   │
│             │                                                      │
└─────────────┼──────────────────────────────────────────────────────┘
              │
              │ SQL Queries
              │ (JDBC/Thrift)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Databricks Cloud                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 SQL Warehouse                               │ │
│  │                                                              │ │
│  │  Query: SELECT * FROM                                       │ │
│  │         fox_bi_dev.dataops_dashboard.mmm_job_status_check   │ │
│  │         WHERE DATE(job_start_time_utc) = '2025-01-05'       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Delta Lake Table                               │ │
│  │  fox_bi_dev.dataops_dashboard.mmm_job_status_check         │ │
│  │                                                              │ │
│  │  Columns:                                                   │ │
│  │  - job_id, run_id, job_name                                │ │
│  │  - job_platform, job_status                                │ │
│  │  - domain_name, duration_secs                              │ │
│  │  - job_start_time_utc, etc.                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. Initial Page Load

```
User Opens Browser
        │
        ▼
React App Loads
        │
        ├─→ useEffect() triggers
        │        │
        │        ├─→ loadBulletins()  ──→  GET /api/bulletins  ──→  Read bulletins.json
        │        │                                                          │
        │        │                                                          ▼
        │        │                                                    [Bulletins Array]
        │        │
        │        └─→ loadJobs()  ──→  POST /api/dashboard/jobs
        │                                     │
        │                                     ▼
        │                            Build SQL Query with date filter
        │                                     │
        │                                     ▼
        │                            Execute on Databricks
        │                                     │
        │                                     ▼
        │                               [Job Data Array]
        │                                     │
        ▼                                     ▼
Display Dashboard with Metrics & Charts
```

### 2. Date Filter Change

```
User Clicks Calendar Icon
        │
        ▼
FilterSidebar Opens
        │
        ▼
User Selects New Date
        │
        ▼
selectedDate State Updates
        │
        ▼
useEffect Detects Change
        │
        ▼
loadJobs() Called with New Date
        │
        ▼
POST /api/dashboard/jobs { selectedDate: "2025-01-05" }
        │
        ▼
SQL Query: WHERE DATE(job_start_time_utc) = '2025-01-05'
        │
        ▼
Databricks Returns Filtered Jobs
        │
        ▼
Dashboard Re-renders with New Data
```

### 3. Domain Tab Switch

```
User Clicks "AdSales" Tab
        │
        ▼
activeTab State → "adsales"
        │
        ▼
getJobsByDomain("adsales") Filters Jobs (CLIENT-SIDE)
        │
        ├─→ Filter: job.domain_name.toLowerCase() === "adsales"
        │
        ▼
Calculate Metrics for Filtered Jobs
        │
        ├─→ calculateMetrics(filteredJobs)
        ├─→ calculatePlatformMetrics(filteredJobs)
        │
        ▼
DashboardPage Re-renders with AdSales Data Only
```

### 4. Refresh Button

```
User Clicks Refresh
        │
        ▼
handleRefresh() Called
        │
        ▼
isLoading → true (shows spinner)
        │
        ▼
loadJobs() with Current Date
        │
        ▼
POST /api/dashboard/jobs { selectedDate: currentDate }
        │
        ▼
Databricks Query Executed
        │
        ▼
New Data Received
        │
        ├─→ Update lastRefresh Timestamp
        ├─→ Update allJobs State
        ├─→ isLoading → false
        │
        ▼
Toast Notification: "Loaded X jobs"
        │
        ▼
Dashboard Re-renders
```

### 5. Add Critical Bulletin

```
User Clicks + in Critical Info Box
        │
        ▼
isAdding → true (shows textarea)
        │
        ▼
User Types Message & Clicks Save
        │
        ▼
handleSaveBulletin(message)
        │
        ▼
POST /api/bulletins { message: "...", createdBy: "..." }
        │
        ▼
Backend Reads bulletins.json
        │
        ▼
Creates New Bulletin Object
        │
        ├─→ id: timestamp
        ├─→ message: user input
        ├─→ timestamp: now
        ├─→ createdBy: "Data Ops Team"
        │
        ▼
Prepend to Array (max 10)
        │
        ▼
Write to bulletins.json
        │
        ▼
Return Updated Bulletins
        │
        ▼
Frontend Updates bulletins State
        │
        ▼
Toast: "Bulletin saved successfully"
        │
        ▼
New Bulletin Appears at Top
```

## Component Hierarchy

```
App
├── Toaster (Toast notifications)
├── Header
│   ├── Title & Description
│   └── Controls
│       ├── Last Refresh Display
│       ├── Date Filter Button → Opens FilterSidebar
│       └── Refresh Button
│
├── Tabs Container
│   ├── TabsList
│   │   ├── All Domains Tab
│   │   ├── AdSales Tab
│   │   ├── AdTech Tab
│   │   ├── Engagement Tab
│   │   ├── Ratings Tab
│   │   ├── MMM Tab
│   │   ├── FoxOne Tab
│   │   └── Audience & Activation Tab
│   │
│   └── TabsContent (for each tab)
│       └── DashboardPage
│           ├── KPI Cards Row
│           │   ├── KPICard (Job Status)
│           │   ├── KPICard (Overrunning Jobs)
│           │   └── KPICard (Incidents)
│           │
│           ├── Chart & Info Row
│           │   ├── PlatformChart (2/3 width)
│           │   │   └── Recharts BarChart
│           │   └── CriticalInfoBox (1/3 width)
│           │       ├── Add Bulletin Form (conditional)
│           │       └── Bulletin List
│           │           └── Bulletin Items
│           │
│           └── JobsTable
│               ├── Search Input
│               └── Table
│                   ├── TableHeader
│                   └── TableBody
│                       └── TableRows (filtered jobs)
│
└── FilterSidebar (Sheet overlay)
    └── Calendar Component
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      App Component State                     │
│                                                               │
│  selectedDate ────────┐                                      │
│  allJobs ─────────────┼──→ Passed to DashboardPage           │
│  bulletins ───────────┤                                      │
│  isFilterOpen ────────┤                                      │
│  isLoading ───────────┤                                      │
│  lastRefresh ─────────┤                                      │
│  activeTab ───────────┘                                      │
│                                                               │
│  Derived State:                                              │
│  └─→ currentJobs = getJobsByDomain(activeTab)               │
│      └─→ metrics = calculateMetrics(currentJobs)            │
│          └─→ platformMetrics = calculatePlatformMetrics()   │
└─────────────────────────────────────────────────────────────┘
```

## API Request/Response Examples

### Fetch Jobs

**Request:**
```http
POST /api/dashboard/jobs HTTP/1.1
Content-Type: application/json

{
  "selectedDate": "2025-01-05",
  "domain": "mmm"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "job_id": "1066075818932604",
      "run_id": "353257254304676",
      "job_name": "mmm_validations_weekly",
      "job_platform": "databricks",
      "job_status": "FAILED",
      "domain_name": "mmm",
      "duration_secs": 1687,
      "avg_duration_secs": 1926,
      ...
    }
  ],
  "count": 1
}
```

### Add Bulletin

**Request:**
```http
POST /api/bulletins HTTP/1.1
Content-Type: application/json

{
  "bulletin": {
    "message": "Snowflake maintenance at 10 AM ET",
    "createdBy": "Data Ops Team"
  }
}
```

**Response:**
```json
{
  "success": true,
  "bulletin": {
    "id": "1704452400000",
    "message": "Snowflake maintenance at 10 AM ET",
    "timestamp": "2025-01-05T14:00:00.000Z",
    "createdBy": "Data Ops Team"
  },
  "bulletins": [ /* all bulletins */ ]
}
```

## Technology Integration Points

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend Technologies                    │
│                                                              │
│  React 18 ──→ Component rendering & state management        │
│  TypeScript ──→ Type safety & IDE support                   │
│  Tailwind CSS ──→ Styling & responsive design               │
│  Recharts ──→ Bar chart visualization                       │
│  date-fns ──→ Date formatting & manipulation                │
│  Radix UI ──→ Accessible UI primitives                      │
│  Sonner ──→ Toast notifications                             │
└────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    Backend Technologies                     │
│                                                              │
│  Express ──→ HTTP server & routing                          │
│  CORS ──→ Cross-origin request handling                     │
│  @databricks/sql ──→ Databricks SQL connector               │
│  dotenv ──→ Environment variable management                 │
│  fs/promises ──→ File system operations                     │
└────────────────────────────────────────────────────────────┘
                              │
                              │ JDBC/Thrift Protocol
                              ▼
┌────────────────────────────────────────────────────────────┐
│                   Databricks Platform                       │
│                                                              │
│  SQL Warehouse ──→ Query execution engine                   │
│  Delta Lake ──→ Table storage format                        │
│  Unity Catalog ──→ Metadata & governance                    │
└────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Development Environment
```
Developer Machine
├── Terminal 1: npm run dev (Frontend on :5173)
├── Terminal 2: node server.js (Backend on :3001)
└── Browser: localhost:5173
```

### Production Environment (Recommended)
```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │  Load Balancer │
              │   (HTTPS/443)  │
              └────────┬───────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌──────────────────┐
│   Frontend      │       │    Backend       │
│   (Static CDN)  │       │  (API Server)    │
│   Vercel/S3     │       │  EC2/Cloud Run   │
│   Port: 443     │       │  Port: 3001      │
└─────────────────┘       └────────┬─────────┘
                                   │
                                   │ SQL Connection
                                   │ (Encrypted)
                                   ▼
                          ┌─────────────────┐
                          │   Databricks    │
                          │  SQL Warehouse  │
                          │  (Cloud)        │
                          └─────────────────┘
```

---

This architecture provides a scalable, maintainable foundation for the One Ops Dashboard with clear separation of concerns and straightforward deployment options.
