// ============================================================
// ONE OPS DASHBOARD - Node.js/Express Backend
// ============================================================
// 
// Installation:
// npm install express cors @databricks/sql dotenv
//
// Run:
// node server.js
// ============================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { DBSQLClient } = require('@databricks/sql');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Databricks configuration from environment variables
const databricksConfig = {
  host: process.env.DATABRICKS_HOST,
  path: process.env.DATABRICKS_HTTP_PATH,
  token: process.env.DATABRICKS_TOKEN,
};

// Path to store bulletins and mock data
const BULLETINS_FILE = path.join(__dirname, 'bulletins.json');
const MOCK_DATA_FILE = path.join(__dirname, 'mock-data.json');
const INCIDENTS_FILE = path.join(__dirname, 'incidents.json');

// Check if Databricks is configured
const isDatabricksConfigured = !!(databricksConfig.host && databricksConfig.token && databricksConfig.path);

// Domain validation for incidents
const ALLOWED_DOMAINS = [
  'AdSales',
  'AdTech',
  'Engagement',
  'Ratings',
  'MMM',
  'FoxOne',
  'Audience & Activation'
];

// Simple in-memory cache for job queries (per date + domain)
// Structure: { key: { data, timestamp } }
const jobCache = new Map();
const CACHE_MAX_ENTRIES = 20; // keep last 20 queries
// Track in-flight queries to avoid duplicate DB hits when requests arrive simultaneously
const inFlightQueries = new Map();

// Helper function to execute Databricks SQL queries
async function executeDatabricksQuery(query) {
  const client = new DBSQLClient();
  
  try {
    await client.connect({
      host: databricksConfig.host,
      path: databricksConfig.path,
      token: databricksConfig.token,
    });

    const session = await client.openSession();
    const queryOperation = await session.executeStatement(query);
    
    const result = await queryOperation.fetchAll();
    await queryOperation.close();
    await session.close();
    await client.close();
    
    return result;
  } catch (error) {
    console.error('Databricks query error:', error);
    throw error;
  }
}

function makeCacheKey(selectedDate, domain) {
  return `${selectedDate || 'null'}::${(domain || 'all').toLowerCase()}`;
}

function setCache(key, data) {
  jobCache.set(key, { data, timestamp: Date.now() });
  // simple eviction if we exceed max entries
  if (jobCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = [...jobCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    jobCache.delete(oldestKey);
  }
}

// API Endpoint: Fetch Dashboard Data
app.post('/api/dashboard/jobs', async (req, res) => {
  try {
    const { selectedDate, domain, clearCache } = req.body;

    console.log(`Fetching jobs for date: ${selectedDate}, domain: ${domain || 'ALL'}`);

    const cacheKey = makeCacheKey(selectedDate, domain);
    if (!clearCache && jobCache.has(cacheKey)) {
      const cached = jobCache.get(cacheKey);
      console.log(`Cache hit for ${cacheKey} (items: ${cached.data.length})`);
      return res.json({
        success: true,
        data: cached.data,
        count: cached.data.length,
        cached: true
      });
    }

    // If a request for the same key is already in-flight, reuse it
    if (!clearCache && inFlightQueries.has(cacheKey)) {
      console.log(`Awaiting in-flight query for ${cacheKey}`);
      const data = await inFlightQueries.get(cacheKey);
      return res.json({
        success: true,
        data,
        count: data.length,
        cached: true
      });
    }

    // Start a new query and register it as in-flight
    const fetchPromise = (async () => {
      // Build query based on date filter against the per-day unified view
      let query = `
        SELECT * 
        FROM fox_bi_dev.dataops_dashboard.vw_job_status_latest_per_day
        WHERE job_date = '${selectedDate}'
      `;

      // Add domain filter if specified
      if (domain && domain !== 'all') {
        query += ` AND LOWER(domain_name) = LOWER('${domain}')`;
      }

      query += ` ORDER BY job_start_time_utc DESC`;

      const result = await executeDatabricksQuery(query);

      // Aggregate counts by domain for easier troubleshooting
      const domainCounts = result.reduce((acc, row) => {
        const key = (row.domain_name || 'unknown').toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      console.log(`Successfully fetched ${result.length} jobs. Domain breakdown:`, domainCounts);

      setCache(cacheKey, result);
      return result;
    })();

    if (!clearCache) {
      inFlightQueries.set(cacheKey, fetchPromise);
    }

    const result = await fetchPromise;
    inFlightQueries.delete(cacheKey);

    res.json({ 
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch dashboard data',
      details: error.toString()
    });
  }
});

// API Endpoint: Clear cache (all or specific key)
app.post('/api/cache/clear', (req, res) => {
  const { selectedDate, domain } = req.body || {};
  if (!selectedDate && !domain) {
    jobCache.clear();
    console.log('Cache cleared: all entries');
    return res.json({ success: true, cleared: 'all' });
  }
  const cacheKey = makeCacheKey(selectedDate, domain);
  const existed = jobCache.delete(cacheKey);
  console.log(`Cache clear for key ${cacheKey}: ${existed ? 'deleted' : 'not found'}`);
  res.json({ success: true, cleared: existed ? cacheKey : 'not_found' });
});

// API Endpoint: Get Critical Bulletins
app.get('/api/bulletins', async (req, res) => {
  try {
    // Check if file exists
    try {
      const data = await fs.readFile(BULLETINS_FILE, 'utf8');
      const bulletins = JSON.parse(data);
      res.json({ success: true, bulletins });
    } catch (error) {
      // If file doesn't exist, return empty array
      res.json({ success: true, bulletins: [] });
    }
  } catch (error) {
    console.error('Error reading bulletins:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to read bulletins'
    });
  }
});

// API Endpoint: Save Critical Bulletin
app.post('/api/bulletins', async (req, res) => {
  try {
    const { bulletin } = req.body;

    if (!bulletin || !bulletin.message) {
      return res.status(400).json({ 
        error: 'Bulletin message is required' 
      });
    }

    // Read existing bulletins
    let bulletins = [];
    try {
      const data = await fs.readFile(BULLETINS_FILE, 'utf8');
      bulletins = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }

    // Add new bulletin with timestamp and ID
    const newBulletin = {
      id: Date.now().toString(),
      message: bulletin.message,
      timestamp: new Date().toISOString(),
      createdBy: bulletin.createdBy || 'System'
    };

    bulletins.unshift(newBulletin); // Add to beginning

    // Keep only last 10 bulletins
    bulletins = bulletins.slice(0, 10);

    // Write back to file
    await fs.writeFile(BULLETINS_FILE, JSON.stringify(bulletins, null, 2));

    console.log('Bulletin saved successfully');

    res.json({ 
      success: true,
      bulletin: newBulletin,
      bulletins
    });

  } catch (error) {
    console.error('Error saving bulletin:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to save bulletin'
    });
  }
});

// API Endpoint: Delete Bulletin
app.delete('/api/bulletins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Read existing bulletins
    let bulletins = [];
    try {
      const data = await fs.readFile(BULLETINS_FILE, 'utf8');
      bulletins = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'No bulletins found' });
    }

    // Filter out the bulletin to delete
    bulletins = bulletins.filter(b => b.id !== id);

    // Write back to file
    await fs.writeFile(BULLETINS_FILE, JSON.stringify(bulletins, null, 2));

    console.log(`Bulletin ${id} deleted successfully`);

    res.json({ 
      success: true,
      bulletins
    });

  } catch (error) {
    console.error('Error deleting bulletin:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete bulletin'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    databricksConfigured: isDatabricksConfigured,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 One Ops Dashboard Backend running on http://localhost:${PORT}`);
  console.log(`📊 Databricks host: ${databricksConfig.host || 'NOT CONFIGURED'}`);
  console.log(`🔑 Token configured: ${databricksConfig.token ? 'YES' : 'NO'}`);
});