// Dashboard Types

export interface JobData {
  job_id: string;
  run_id: string;
  job_name: string;
  job_platform: string;
  parent_pipeline: string;
  medallion_layer: string | null;
  table_type: string | null;
  job_status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING' | 'QUEUED' | 'UNKNOWN';
  job_start_time_utc: string;
  job_end_time_utc: string;
  duration_secs: number | null;
  validation_status: string | null;
  datasource_name: string;
  domain_name: string;
  subdomain_name: string | null;
  subnotebook: string | null;
  avg_duration_secs: number | null;
  sla_met: boolean | null;
  run_type: string;
  etl_created_at_utc: string;
  etl_updated_at_utc: string;
}

export interface DashboardMetrics {
  totalJobs: number;
  successJobs: number;
  failedJobs: number;
  runningJobs: number;
  pendingJobs: number;
  queuedJobs: number;
  unknownJobs: number;
  overrunningJobs: number;
  incidents: number;
}

export interface PlatformMetrics {
  platform: string;
  success: number;
  failed: number;
  running: number;
  pending: number;
  queued: number;
  unknown: number;
}

export interface Bulletin {
  id: string;
  message: string;
  timestamp: string;
  createdBy: string;
}

export interface Incident {
  key: string;
  domain: string;
  title: string;
  status: string;
  issueType: string;
  assignee: string | null;
  reporter: string | null;
  created: string | null;
  updated: string | null;
  lastComment?: {
    author: string | null;
    body: string | null;
  };
  lastFetched?: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
}

export const DOMAINS = [
  'AdSales',
  'AdTech',
  'Engagement',
  'Ratings',
  'MMM',
  'FoxOne',
  'Audience & Activation'
] as const;

export type Domain = typeof DOMAINS[number] | 'all';
