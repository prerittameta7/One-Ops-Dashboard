# Development Notes - One Ops Dashboard

## 🏗️ Architecture

### Frontend Stack
- **React 18.3** with TypeScript
- **Tailwind CSS 4.0** for styling
- **Recharts** for data visualization
- **Radix UI** components (shadcn/ui)
- **date-fns** for date formatting
- **Sonner** for toast notifications

### Backend Stack
- **Node.js** with Express
- **@databricks/sql** for Databricks connectivity
- **CORS** enabled for local development
- File-based storage for bulletins (JSON)

## 📂 Component Architecture

```
App.tsx (Main Container)
├── Header (Sticky navigation)
│   ├── Date Filter Button
│   ├── Refresh Button
│   └── Last Refresh Time
├── Tabs (Domain Navigation)
│   ├── All Domains Tab
│   └── Individual Domain Tabs (7)
└── DashboardPage (Per Tab)
    ├── KPICards (3 metrics)
    │   ├── Job Status Card
    │   ├── Overrunning Jobs Card
    │   └── Active Incidents Card
    ├── Grid Layout
    │   ├── PlatformChart (2/3 width)
    │   └── CriticalInfoBox (1/3 width)
    └── JobsTable (Full width)

FilterSidebar (Sheet overlay)
└── Calendar Date Picker
```

## 🔄 Data Flow

1. **Initial Load**
   - App mounts → `loadBulletins()` + `loadJobs()`
   - Fetches data for current date
   - Displays in "All Domains" tab

2. **Date Change**
   - User selects date in FilterSidebar
   - `selectedDate` state updates
   - useEffect triggers `loadJobs()` with new date
   - Databricks query executed with date filter

3. **Domain Switch**
   - User clicks domain tab
   - `activeTab` state changes
   - Jobs filtered client-side by `domain_name`
   - Metrics recalculated for filtered jobs

4. **Manual Refresh**
   - User clicks Refresh button
   - `loadJobs()` called with current date
   - Loading state shown during fetch
   - Toast notification on success/error

## 🔧 Key Utilities

### metrics.ts
- `calculateMetrics()`: Computes KPIs from job array
- `calculatePlatformMetrics()`: Groups jobs by platform
- `getStatusColor()`: Maps status to Tailwind color classes
- `getStatusBadgeColor()`: Maps status to badge styles

### api.ts
- `fetchJobs()`: POST to `/api/dashboard/jobs`
- `fetchBulletins()`: GET bulletins list
- `saveBulletin()`: POST new bulletin
- `deleteBulletin()`: DELETE bulletin by ID
- `checkHealth()`: Backend health check

## 🎨 Styling Approach

- **Theme tokens** in `/src/styles/theme.css`
- **No custom font sizes** in components (use defaults)
- **Responsive grid** for KPIs and charts
- **Sticky header** for persistent navigation
- **Max width 1600px** for dashboard content

## 🔒 Security Considerations

### Current Implementation (Development)
- ✅ CORS enabled for localhost
- ✅ Environment variables for credentials
- ✅ Backend-only Databricks token storage
- ⚠️ No authentication (all users can edit bulletins)
- ⚠️ No SQL injection protection (uses string concatenation)

### Production Recommendations
- [ ] Add user authentication (OAuth, SAML)
- [ ] Implement role-based access control
- [ ] Use parameterized queries for SQL
- [ ] Add rate limiting
- [ ] Enable HTTPS only
- [ ] Rotate Databricks tokens regularly
- [ ] Add audit logging for bulletin changes
- [ ] Implement CSRF protection

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Load dashboard with today's date
- [ ] Change date filter and verify data updates
- [ ] Switch between domain tabs
- [ ] Add/delete critical bulletins
- [ ] Search jobs in table
- [ ] Test with no jobs for selected date
- [ ] Test with Databricks disconnected
- [ ] Verify overrunning job highlighting
- [ ] Check responsive design (mobile/tablet)

### Future Automated Testing
- Unit tests for metrics calculations
- Integration tests for API endpoints
- E2E tests for critical user flows
- Mock Databricks responses

## 📊 Performance Optimization

### Current Optimizations
- Client-side domain filtering (no extra API calls)
- Metrics calculated once per render
- Debounced search in jobs table (via React state)

### Future Optimizations
- [ ] Virtual scrolling for large job tables
- [ ] Pagination for jobs (backend)
- [ ] Caching layer (Redis) for frequent queries
- [ ] WebSocket for real-time updates
- [ ] Lazy loading for inactive tabs
- [ ] Service worker for offline support

## 🐛 Known Limitations

1. **Date Range**: Currently single date only (no range)
2. **Incidents**: Placeholder value (JIRA not integrated)
3. **Authentication**: None (all users have full access)
4. **Real-time**: Manual refresh required
5. **Historical Trends**: No trend analysis
6. **Export**: No PDF/Excel export
7. **Notifications**: No email/Slack alerts
8. **Table Flexibility**: Fixed column schema

## 🔮 Future Features (Roadmap)

### Phase 2 - JIRA Integration
- Real incidents count from JIRA
- Link jobs to incidents
- Incident details modal

### Phase 3 - Authentication & Authorization
- SSO integration
- Role-based access (viewer/editor/admin)
- Audit trail for changes

### Phase 4 - Enhanced Analytics
- Historical trend charts
- SLA compliance tracking
- Predictive failure analysis
- Anomaly detection

### Phase 5 - Notifications & Alerts
- Email notifications for failures
- Slack integration
- Configurable alert thresholds
- Alert acknowledgment workflow

### Phase 6 - Advanced Features
- Custom dashboard builder
- Saved filters and views
- Scheduled reports
- Data export (PDF, Excel, CSV)
- API documentation (Swagger)

## 💡 Development Tips

### Adding a New Domain
1. Update `DOMAINS` array in `/src/types/dashboard.ts`
2. Ensure domain name matches `domain_name` in database
3. Tab will auto-generate in App.tsx

### Adding a New KPI
1. Add field to `DashboardMetrics` interface
2. Calculate in `calculateMetrics()` function
3. Add `<KPICard>` in DashboardPage.tsx

### Adding a New Platform
- No code changes needed
- Platform name from `job_platform` field
- Chart auto-updates with new platforms

### Debugging Databricks Queries
1. Check backend console for SQL query
2. Run query directly in Databricks SQL Editor
3. Verify table and column names
4. Check date format compatibility

### Testing Without Databricks
- Backend will fail gracefully
- Frontend shows empty state
- Mock data available in `mock-data.json`
- Can extend server.js to use mock data as fallback

## 📝 Code Standards

### TypeScript
- Strict mode enabled
- Explicit interface definitions
- No `any` types (use `unknown` if needed)

### React
- Functional components only
- Hooks for state management
- Props interfaces for all components

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case or PascalCase for components

### Import Order
1. React/library imports
2. Component imports
3. Utility/type imports
4. Relative imports
5. Asset imports

## 🚀 Deployment Guide

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Upload dist/ folder
# Set environment variable: VITE_API_URL=https://api.yourdomain.com
```

### Backend Deployment (AWS/GCP/Azure)
```bash
# Install production dependencies
npm install --production

# Set environment variables
export DATABRICKS_HOST=...
export DATABRICKS_HTTP_PATH=...
export DATABRICKS_TOKEN=...
export PORT=3001

# Run with PM2
pm2 start server.js --name one-ops-backend
```

### Docker Deployment
```dockerfile
# Backend Dockerfile example
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
```

## 📞 Support & Contribution

### Getting Help
- Check SETUP_INSTRUCTIONS.md first
- Review error messages in browser/backend console
- Verify Databricks connection with health endpoint

### Contributing
- Follow existing code patterns
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before committing

---

**Last Updated**: January 5, 2026
**Maintainer**: Data Platform Team
