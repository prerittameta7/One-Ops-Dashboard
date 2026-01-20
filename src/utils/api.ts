// API utilities for backend communication
import type { ValidationStatusRecord } from '../types/dashboard';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface FetchJobsParams {
  selectedDate: string;
  domain?: string;
  clearCache?: boolean;
}

export interface AddIncidentPayload {
  incidentKey: string;
  domain: string;
}

export interface HistoryPoint {
  domain_name: string;
  job_date: string;
  job_status: string;
  count: number;
}

export interface IncidentHistoryPoint {
  domain: string;
  status: string;
  count: number;
}

export interface AiIncidentLite {
  key: string;
  title: string;
  status: string | null;
  archived: boolean;
}

export interface AiJobLite {
  name: string;
  status: string;
  platform: string;
  datasource: string | null;
  pacingPct?: number | null;
  startTime?: string | null; // HH:mm
}

export interface AiDomainSummary {
  name: string;
  totalJobs: number;
  failed: number;
  pending: number;
  running: number;
  queued: number;
  overrunning: number;
  incidents: number;
  topIncidents?: AiIncidentLite[];
  topJobs?: AiJobLite[];
  validationReports?: {
    report: string;
    datasource: string | null;
    subdomain: string | null;
    status: 'OK' | 'Variance' | 'Waiting';
    slaMet: boolean | null;
    varianceSummary?: string | null;
    statusText?: string | null;
    slaCutoff?: string | null;
  }[];
  anomaly: boolean;
  sinceTime?: string | null;
}

export interface AiSummaryResponse {
  success: boolean;
  message: string;
  updatedAt: string;
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

export async function fetchHistory(selectedDate: string) {
  const url = `${API_BASE_URL}/api/dashboard/history?selectedDate=${encodeURIComponent(selectedDate)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch history');
  }
  return response.json() as Promise<{ success: boolean; history: HistoryPoint[]; incidents: IncidentHistoryPoint[] }>;
}

export async function fetchValidationStatus(params: { selectedDate: string; domain?: string; refresh?: boolean }) {
  const query = new URLSearchParams({ selectedDate: params.selectedDate });
  if (params.domain) {
    query.set('domain', params.domain);
  }
  if (params.refresh) {
    query.set('refresh', 'true');
  }
  const response = await fetch(`${API_BASE_URL}/api/validation-status?${query.toString()}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch validation status');
  }
  return response.json() as Promise<{ success: boolean; data: ValidationStatusRecord[]; count: number; cached?: boolean }>;
}

export async function fetchAiSummary(domains: AiDomainSummary[], selectedDate: string) {
  const response = await fetch(`${API_BASE_URL}/api/ai/ops-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains, selectedDate }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch AI summary');
  }
  return response.json() as Promise<AiSummaryResponse>;
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
