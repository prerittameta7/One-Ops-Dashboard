// Metrics calculation utilities

import { JobData, DashboardMetrics, PlatformMetrics } from '../types/dashboard';

// Derive a duration even when a job is still running.
// - If duration_secs is present, use it.
// - If running and start time is present, use (now - start).
// - Otherwise return null.
export function getEffectiveDurationSecs(job: JobData): number | null {
  if (job.duration_secs !== null && job.duration_secs !== undefined) {
    return job.duration_secs;
  }

  if (job.job_status === 'RUNNING' && job.job_start_time_utc && job.job_start_time_utc !== '-') {
    const start = new Date(job.job_start_time_utc).getTime();
    if (!Number.isNaN(start)) {
      const now = Date.now();
      const diffSecs = (now - start) / 1000;
      return diffSecs > 0 ? diffSecs : 0;
    }
  }

  return null;
}

export function calculateMetrics(jobs: JobData[]): DashboardMetrics {
  const metrics: DashboardMetrics = {
    totalJobs: jobs.length,
    successJobs: 0,
    failedJobs: 0,
    runningJobs: 0,
    pendingJobs: 0,
    queuedJobs: 0,
    skippedJobs: 0,
    upstreamFailedJobs: 0,
    unknownJobs: 0,
    overrunningJobs: 0,
    incidents: 3, // Dummy number as requested
  };

  jobs.forEach(job => {
    const effectiveDuration = getEffectiveDurationSecs(job);

    switch (job.job_status) {
      case 'SUCCESS':
        metrics.successJobs++;
        break;
      case 'FAILED':
        metrics.failedJobs++;
        break;
      case 'RUNNING':
        metrics.runningJobs++;
        break;
      case 'PENDING':
        metrics.pendingJobs++;
        break;
      case 'QUEUED':
        metrics.queuedJobs++;
        break;
      case 'SKIPPED':
        metrics.skippedJobs++;
        break;
      case 'UPSTREAM_FAILED':
        metrics.upstreamFailedJobs++;
        break;
      case 'UNKNOWN':
        metrics.unknownJobs++;
        break;
    }

    // Check if job is overrunning (duration > avg_duration * 1.5)
    if (
      effectiveDuration !== null &&
      job.avg_duration_secs &&
      effectiveDuration > job.avg_duration_secs * 1.5
    ) {
      metrics.overrunningJobs++;
    }
  });

  return metrics;
}

export function calculatePlatformMetrics(jobs: JobData[]): PlatformMetrics[] {
  const platformMap = new Map<string, PlatformMetrics>();

  jobs.forEach(job => {
    const effectiveDuration = getEffectiveDurationSecs(job);
    const platform = job.job_platform || 'Unknown';
    
    if (!platformMap.has(platform)) {
      platformMap.set(platform, {
        platform,
        success: 0,
        failed: 0,
        running: 0,
        pending: 0,
        queued: 0,
        skipped: 0,
        upstreamFailed: 0,
        unknown: 0,
      });
    }

    const platformData = platformMap.get(platform)!;

    switch (job.job_status) {
      case 'SUCCESS':
        platformData.success++;
        break;
      case 'FAILED':
        platformData.failed++;
        break;
      case 'RUNNING':
        platformData.running++;
        break;
      case 'PENDING':
        platformData.pending++;
        break;
      case 'QUEUED':
        platformData.queued++;
        break;
      case 'SKIPPED':
        platformData.skipped++;
        break;
      case 'UPSTREAM_FAILED':
        platformData.upstreamFailed++;
        break;
      case 'UNKNOWN':
        platformData.unknown++;
        break;
    }
  });

  return Array.from(platformMap.values());
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'text-green-600';
    case 'FAILED':
      return 'text-red-600';
    case 'RUNNING':
      return 'text-blue-600';
    case 'PENDING':
      return 'text-yellow-600';
    case 'QUEUED':
      return 'text-orange-600';
    case 'SKIPPED':
      return 'text-gray-500';
    case 'UPSTREAM_FAILED':
      return 'text-red-600';
    case 'UNKNOWN':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'QUEUED':
      return 'bg-orange-100 text-orange-800';
    case 'SKIPPED':
      return 'bg-gray-100 text-gray-700';
    case 'UPSTREAM_FAILED':
      return 'bg-red-100 text-red-800';
    case 'UNKNOWN':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
