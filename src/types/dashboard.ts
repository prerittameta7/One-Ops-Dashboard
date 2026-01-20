// Dashboard Types


export interface JobData {
  job_id: string;
  run_id: string;
  job_name: string;
  job_platform: string;
  parent_pipeline: string;
  medallion_layer: string | null;
  table_type: string | null;
  job_status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING' | 'QUEUED' | 'SKIPPED' | 'UPSTREAM_FAILED' | 'UNKNOWN';
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
  skippedJobs: number;
  upstreamFailedJobs: number;
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
  skipped: number;
  upstreamFailed: number;
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

export interface DomainHistoryPoint {
  domain_name: string;
  job_date: string; // yyyy-MM-dd
  job_status: JobData['job_status'];
  count: number;
}

export interface DomainIncidentHistoryPoint {
  domain: string;
  status: string;
  count: number;
}

export interface ValidationStatusRecord {
  validation_id: string;
  validation_report: string | null;
  validation_type: string | null;
  datasource_name: string | null;
  domain_name: string | null;
  subdomain_name: string | null;
  facet_key: string | null;
  facet_value: string | null;
  validation_status: boolean | null;
  validation_status_text: string | null;
  validation_data_date: string | null;
  validation_start_time_utc: string | null;
  validation_end_time_utc: string | null;
  duration_secs: number | null;
  contributing_job_names: string[] | null;
  contributing_run_ids: string[] | null;
  kpis_json: string | null;
  metrics_json: string | null;
  sla_cutoff_time_utc: string | null;
  etl_created_timestamp_utc: string | null;
  etl_updated_timestamp_utc: string | null;
  val_sla_met: boolean | null;
  validation_message: string | null;
  reporting_date_utc: string | null;
}
