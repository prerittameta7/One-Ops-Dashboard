# One Ops Dashboard - Setup Instructions

## Overview
One Ops Dashboard provides comprehensive health monitoring for all domains in the Data Platform Team at Fox Corporation. It tracks job statuses, performance metrics, and incidents across 7 major domains: AdSales, AdTech, Engagement, Ratings, MMM, FoxOne, and Audience & Activation.

## Complete Setup Guide (Chronological Order)

## There would be a Total of 3 Terminals at the end of the setup:
1. Backend Server
2. Frontend Server
3. Backend Test & Optional Terminal


### Step 1: Open the Project
```bash
# Navigate to the project directory
cd "/Users/preritt.ameta/Desktop/One Ops Dashboard"

# Or if you cloned it to a different location:
# cd path/to/One-Ops-Dashboard
```

### Step 2: Install Homebrew
```bash
# Check if Homebrew is already installed
brew --version

# If not installed, install Homebrew:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 3: Install Node.js 18 via Homebrew
```bash
# Install Node.js v18
brew install node@18
```

### Step 4: Add Node.js to PATH
```bash
# Add to PATH (if brew suggests a command, run it):
echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 5: Install nvm (Node Version Manager)
```bash
# Install nvm using Homebrew
brew install nvm
```

### Step 6: Create nvm Directory
```bash
# Create the nvm directory
mkdir -p ~/.nvm
```

### Step 7: Configure nvm in ~/.zshrc
```bash
# Add nvm configuration to your shell profile
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
```

### Step 8: Install Node.js 18 via nvm
```bash
# Install Node.js v18 using nvm
nvm install 18


### Step 9: Verify Installation
```bash
# Check Node.js and npm versions
node -v
npm -v
```

Both commands should show version numbers (Node.js v18.x.x and npm 9.x.x or similar).

### Step 10: Start Backend Server
```bash
# In a new terminal window, navigate to the project directory
cd "/Users/preritt.ameta/Desktop/One Ops Dashboard"

# Run the startup script
./start-dashboard.sh
```
**Note**: No NEED TO CHECK FOR .env file. It has all the required parameters already configured

The backend server will start on `http://localhost:3001`. The script will:
- Check for `.env` file and create one from `.env.example` if needed
- Install backend dependencies if not already installed
- Start the backend server


### Step 11: Check Backend Server Health by running the below command in new terminal
```bash
# In the same terminal or a new one, verify the backend is running
curl http://localhost:3001/api/health
```

You should see a JSON response indicating the backend is healthy and showing Databricks connection status.

<!-- {"status":"ok","databricksConfigured":true,"timestamp":"2026-01-06T08:51:49.326Z"}%   " -->

### Step 12: Start Frontend Development Server in a New Terminal.
```bash
# Open a new terminal window
cd "/Users/preritt.ameta/Desktop/One Ops Dashboard"

# Make sure nvm is loaded (if needed)
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"

# Install frontend dependencies (if not already installed)
npm install

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy). You should see output indicating the Vite dev server is running.


### Step 13: Resolve macOS Security Warning (If Needed)

If you encounter the error: **"rollup.darwin-arm64.node" Not Opened** or **"Cannot find module @rollup/rollup-darwin-arm64"**, follow these steps:

#### Error Symptoms:
- macOS Gatekeeper warning: "Apple could not verify 'rollup.darwin-arm64.node' is free of malware"
- Error: "Cannot find module @rollup/rollup-darwin-arm64"
- Error: "npm has a bug related to optional dependencies"

#### Solution:
```bash
# 1. Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 2. Reinstall dependencies
npm install

# 3. Remove quarantine attribute from node_modules (macOS security)
xattr -r -d com.apple.quarantine node_modules

# 4. Verify the rollup module is now accessible
node -e "require('@rollup/rollup-darwin-arm64')" && echo "✓ Rollup native module loads successfully"
```

**Explanation**: This is a known npm bug with optional dependencies (https://github.com/npm/cli/issues/4828). macOS adds a quarantine attribute to files downloaded from the internet, which blocks native binaries. Removing the quarantine attribute allows the files to run normally.

## Accessing the Dashboard

Once both servers are running:
- **Frontend**: Open your browser and navigate to `http://localhost:5173`
- **Backend API**: Available at `http://localhost:3001`

## Databricks Configuration

### Getting Your Databricks Credentials

Before the dashboard can fetch data, you need to configure your Databricks credentials in the `.env` file:

1. **Host**: Found in your Databricks workspace URL
   - Example: `dbc-362ea1dc-960b.cloud.databricks.com`

2. **HTTP Path**: From your SQL Warehouse settings
   - Navigate to: SQL Warehouses → Your Warehouse → Connection Details
   - Example: `/sql/1.0/warehouses/68cad3c53feaecf5`

3. **Token**: Personal Access Token
   - Navigate to: User Settings → Access Tokens → Generate New Token
   - Copy and save the token securely

### Edit .env File
```bash
# Edit the .env file with your credentials
nano .env
# or use your preferred editor (VS Code, vim, etc.)
```

Add your credentials:
```env
DATABRICKS_HOST=your-databricks-host.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_TOKEN=your-personal-access-token
PORT=3001
```

After editing, restart the backend server.

## Troubleshooting

### Backend not connecting to Databricks
1. Verify your `.env` credentials are correct
2. Check that your Databricks SQL Warehouse is running
3. Ensure your access token has not expired
4. Check network connectivity to Databricks

### Frontend not loading data
1. Ensure backend is running on port 3001
2. Check browser console for CORS errors
3. Verify API_URL in frontend .env matches backend port

### No jobs showing
1. Verify the table `fox_bi_dev.dataops_dashboard.mmm_job_status_check` exists
2. Check that jobs exist for the selected date
3. Verify the query in server.js matches your table schema

### Port already in use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process or change port in .env
```

## Features

### Dashboard Pages
- **All Domains**: Cumulative view of all 7 domains
- **Individual Domain Pages**: Dedicated pages for each domain showing domain-specific metrics

### Key Metrics
1. **Job Status**: Total jobs broken down by status (Success/Failed/Running/Pending/Queued/Unknown)
2. **Overrunning Jobs**: Jobs where duration > 1.5x average duration
3. **Active Incidents**: Critical issues count (currently placeholder - will be integrated with JIRA)

### Features
- **Real-time Refresh**: Click refresh to fetch latest data from Databricks
- **Date Filter**: Filter jobs by specific date (defaults to current date)
- **Platform Chart**: Visual breakdown of job statuses by platform (DBT, Databricks, Airflow, Snowflake, DLT)
- **Critical Information Bulletins**: Editable alerts for team communication
- **Job Search**: Search and filter jobs in the table
- **Overrun Highlighting**: Jobs exceeding 1.5x average runtime are highlighted in red

## API Endpoints

### Backend Endpoints

#### POST /api/dashboard/jobs
Fetch jobs from Databricks
```json
{
  "selectedDate": "2025-01-05",
  "domain": "mmm" // optional
}
```

#### GET /api/bulletins
Get all critical bulletins

#### POST /api/bulletins
Create a new bulletin
```json
{
  "bulletin": {
    "message": "Critical update message",
    "createdBy": "Data Ops Team"
  }
}
```

#### DELETE /api/bulletins/:id
Delete a bulletin by ID

#### GET /api/health
Health check endpoint

## Future Enhancements
- [ ] JIRA integration for real incidents count
- [ ] User authentication and role-based access
- [ ] Email notifications for critical failures
- [ ] SLA tracking and alerts
- [ ] Historical trend analysis
- [ ] Export functionality for reports
- [ ] Real-time WebSocket updates
- [ ] Customizable dashboards per user

## Support
For issues or questions, contact the Data Platform Team.
