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

// Helpers for incidents persistence and JIRA fetch
async function loadIncidentsFromFile() {
  try {
    const data = await fs.readFile(INCIDENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function saveIncidentsToFile(incidents) {
  await fs.writeFile(INCIDENTS_FILE, JSON.stringify(incidents, null, 2));
}

function isValidDomain(domain) {
  return ALLOWED_DOMAINS.some(d => d.toLowerCase() === (domain || '').toLowerCase());
}

function normalizeDomain(domain) {
  const found = ALLOWED_DOMAINS.find(d => d.toLowerCase() === (domain || '').toLowerCase());
  return found || domain;
}

function extractTextFromADF(adf) {
  if (!adf) return null;
  const parts = [];
  function walk(node) {
    if (!node) return;
    if (node.type === 'text' && node.text) parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(adf);
  return parts.join(' ').trim() || null;
}

async function fetchJiraIssue(issueKey) {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!host || !email || !token) {
    throw new Error('JIRA credentials are not configured (JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN)');
  }

  const url = `https://${host}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,status,issuetype,assignee,reporter,created,updated,comment`;
  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    },
    agent: new https.Agent({ keepAlive: true })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`JIRA fetch failed (${response.status}): ${body}`);
  }

  const json = await response.json();
  const fields = json.fields || {};
  const comments = (fields.comment && fields.comment.comments) || [];
  const lastComment = comments.length ? comments[comments.length - 1] : null;

  return {
    key: json.key,
    title: fields.summary || '',
    status: (fields.status && fields.status.name) || 'Unknown',
    issueType: (fields.issuetype && fields.issuetype.name) || 'Unknown',
    assignee: (fields.assignee && fields.assignee.displayName) || null,
    reporter: (fields.reporter && fields.reporter.displayName) || null,
    created: fields.created || null,
    updated: fields.updated || null,
    lastComment: lastComment ? {
      author: (lastComment.author && lastComment.author.displayName) || null,
      body: extractTextFromADF(lastComment.body) || null
    } : undefined,
    lastFetched: new Date().toISOString()
  };
}

async function refreshIncidentsList(incidents) {
  const activeIncidents = incidents.filter((incident) => !incident.archivedAt);
  const archivedIncidents = incidents.filter((incident) => incident.archivedAt);

  const refreshed = [];
  for (const incident of activeIncidents) {
    try {
      const jiraData = await fetchJiraIssue(incident.key);
      refreshed.push({
        ...incident,
        ...jiraData,
        domain: normalizeDomain(incident.domain),
        archivedAt: null,
        archivedBy: null
      });
    } catch (err) {
      console.error(`Failed to refresh incident ${incident.key}:`, err);
      refreshed.push({ ...incident, error: err.message });
    }
  }

  const merged = [...refreshed, ...archivedIncidents];
  await saveIncidentsToFile(merged);
  return merged;
}

async function archiveIncident(key, archivedBy = 'Dashboard User') {
  const incidents = await loadIncidentsFromFile();
  const idx = incidents.findIndex((inc) => inc.key === key);
  if (idx === -1) {
    return { error: `Incident ${key} not found`, status: 404, incidents };
  }

  const existing = incidents[idx];
  if (!existing.archivedAt) {
    incidents[idx] = {
      ...existing,
      archivedAt: new Date().toISOString(),
      archivedBy: archivedBy || 'Dashboard User'
    };
    await saveIncidentsToFile(incidents);
  }

  return { incidents };
}

async function restoreIncident(key) {
  const incidents = await loadIncidentsFromFile();
  const idx = incidents.findIndex((inc) => inc.key === key);
  if (idx === -1) {
    return { error: `Incident ${key} not found`, status: 404, incidents };
  }

  incidents[idx] = {
    ...incidents[idx],
    archivedAt: null,
    archivedBy: null
  };
  await saveIncidentsToFile(incidents);
  return { incidents };
}

async function deleteIncidentPermanently(key) {
  let incidents = await loadIncidentsFromFile();
  const beforeCount = incidents.length;
  incidents = incidents.filter((inc) => inc.key !== key);

  if (beforeCount === incidents.length) {
    return { error: `Incident ${key} not found`, status: 404, incidents };
  }

  await saveIncidentsToFile(incidents);
  return { incidents };
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

// API Endpoint: Get Incidents (optional refresh via query ?refresh=true)
app.get('/api/incidents', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    let incidents = await loadIncidentsFromFile();
    if (refresh && incidents.length) {
      incidents = await refreshIncidentsList(incidents);
    }
    res.json({ success: true, incidents });
  } catch (error) {
    console.error('Error reading incidents:', error);
    res.status(500).json({
      error: error.message || 'Failed to read incidents'
    });
  }
});

// API Endpoint: Add Incident (fetch from JIRA, persist locally)
app.post('/api/incidents', async (req, res) => {
  try {
    const { incidentKey, domain } = req.body || {};
    if (!incidentKey || !domain) {
      return res.status(400).json({ error: 'incidentKey and domain are required' });
    }
    if (!isValidDomain(domain)) {
      return res.status(400).json({ error: `Invalid domain. Allowed: ${ALLOWED_DOMAINS.join(', ')}` });
    }

    const jiraData = await fetchJiraIssue(incidentKey);
    let incidents = await loadIncidentsFromFile();

    // Remove duplicates for the same key
    incidents = incidents.filter(inc => inc.key !== jiraData.key);

    const newIncident = {
      ...jiraData,
      domain: normalizeDomain(domain),
      archivedAt: null,
      archivedBy: null
    };

    incidents.unshift(newIncident);
    await saveIncidentsToFile(incidents);

    res.json({ success: true, incident: newIncident, incidents });
  } catch (error) {
    console.error('Error adding incident:', error);
    res.status(500).json({
      error: error.message || 'Failed to add incident'
    });
  }
});

// API Endpoint: Refresh all incidents from JIRA
app.post('/api/incidents/refresh', async (req, res) => {
  try {
    let incidents = await loadIncidentsFromFile();
    if (!incidents.length) {
      return res.json({ success: true, incidents: [] });
    }
    incidents = await refreshIncidentsList(incidents);
    res.json({ success: true, incidents });
  } catch (error) {
    console.error('Error refreshing incidents:', error);
    res.status(500).json({
      error: error.message || 'Failed to refresh incidents'
    });
  }
});

// API Endpoint: Delete Incident by key
app.delete('/api/incidents/:key', async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ error: 'Incident key is required' });
    }

    const { error, status, incidents } = await archiveIncident(key);

    if (error) {
      return res.status(status || 500).json({ error });
    }

    res.json({ success: true, incidents });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete incident'
    });
  }
});

// API Endpoint: Restore Incident by key
app.post('/api/incidents/:key/restore', async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ error: 'Incident key is required' });
    }

    const { error, status, incidents } = await restoreIncident(key);
    if (error) {
      return res.status(status || 500).json({ error });
    }

    res.json({ success: true, incidents });
  } catch (error) {
    console.error('Error restoring incident:', error);
    res.status(500).json({
      error: error.message || 'Failed to restore incident'
    });
  }
});

// API Endpoint: Permanently delete Incident by key
app.delete('/api/incidents/:key/permanent', async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ error: 'Incident key is required' });
    }

    const { error, status, incidents } = await deleteIncidentPermanently(key);
    if (error) {
      return res.status(status || 500).json({ error });
    }

    res.json({ success: true, incidents });
  } catch (error) {
    console.error('Error permanently deleting incident:', error);
    res.status(500).json({
      error: error.message || 'Failed to permanently delete incident'
    });
  }
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