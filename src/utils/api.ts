// API utilities for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface FetchJobsParams {
  selectedDate: string;
  domain?: string;
  clearCache?: boolean;
}

export interface AddIncidentPayload {
  incidentKey: string;
  domain: string;
}

export async function fetchJobs(params: FetchJobsParams) {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch jobs');
  }

  return response.json();
}

export async function fetchIncidents(refresh = false) {
  const response = await fetch(`${API_BASE_URL}/api/incidents${refresh ? '?refresh=true' : ''}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch incidents');
  }
  return response.json();
}

export async function addIncident(payload: AddIncidentPayload) {
  const response = await fetch(`${API_BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add incident');
  }

  return response.json();
}

export async function refreshIncidents() {
  const response = await fetch(`${API_BASE_URL}/api/incidents/refresh`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refresh incidents');
  }
  return response.json();
}

export async function archiveIncident(key: string) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${encodeURIComponent(key)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete incident');
  }
  return response.json();
}

export async function restoreIncident(key: string) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${encodeURIComponent(key)}/restore`, {
    method: 'POST'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to restore incident');
  }
  return response.json();
}

export async function deleteIncidentPermanently(key: string) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${encodeURIComponent(key)}/permanent`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to permanently delete incident');
  }
  return response.json();
}

// Backward compatibility: keep old name pointing to archive behavior
export { archiveIncident as deleteIncident };

export async function fetchBulletins() {
  const response = await fetch(`${API_BASE_URL}/api/bulletins`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bulletins');
  }

  return response.json();
}

export async function saveBulletin(bulletin: { message: string; createdBy?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/bulletins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bulletin }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save bulletin');
  }

  return response.json();
}

export async function deleteBulletin(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/bulletins/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete bulletin');
  }

  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
}
