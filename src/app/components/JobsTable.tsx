import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { JobData } from '../../types/dashboard';
import { getStatusBadgeColor, getEffectiveDurationSecs } from '../../utils/metrics';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface JobsTableProps {
  jobs: JobData[];
  title?: string;
}

export function JobsTable({ jobs, title = 'All Jobs' }: JobsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 20;

  const formatSeconds = (seconds: number | null) => {
    if (seconds === null || Number.isNaN(seconds)) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getProgressPercent = (job: JobData) => {
    if (!job.avg_duration_secs) return null;
    const effectiveDuration = getEffectiveDurationSecs(job);
    if (effectiveDuration === null) return null;
    return (effectiveDuration / job.avg_duration_secs) * 100;
  };

  const getEtaDisplay = (job: JobData) => {
    if (!job.avg_duration_secs) return 'Unknown';
    const startMs = Date.parse(job.job_start_time_utc);
    if (Number.isNaN(startMs)) return 'Unknown';

    const targetSeconds = job.avg_duration_secs * 1.25;
    const eta = new Date(startMs + targetSeconds * 1000);

    return format(eta, 'MMM dd HH:mm');
  };

  const getProgressVisual = (percent: number | null) => {
    if (percent === null) {
      return {
        fill: '#e5e7eb',
        text: 'text-gray-700',
        label: '-',
        width: 0,
        container: 'bg-white',
      };
    }

    const width = Math.min(percent, 100);
    const rounded = Math.round(percent);

    if (percent > 150) {
      return { fill: '#fecdd3', text: 'text-red-800', label: `${rounded}%`, width, container: 'bg-white' };
    }
    if (percent >= 100) {
      return { fill: '#fef9c3', text: 'text-amber-900', label: `${rounded}%`, width, container: 'bg-white' };
    }
    if (percent >= 75) {
      return { fill: '#047857', text: 'text-white', label: `${rounded}%`, width, container: 'bg-emerald-50' };
    }
    if (percent >= 25) {
      return { fill: '#10b981', text: 'text-emerald-900', label: `${rounded}%`, width, container: 'bg-emerald-50' };
    }
    return { fill: '#d1fae5', text: 'text-emerald-800', label: `${rounded}%`, width, container: 'bg-white' };
  };

  const filteredJobs = jobs.filter(job =>
    job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, jobs]);

  const parseStartTime = (value: string) => {
    if (!value || value === '-') return 0;
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? 0 : ts;
  };

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aTime = parseStartTime(a.job_start_time_utc);
    const bTime = parseStartTime(b.job_start_time_utc);
    return bTime - aTime; // newest first
  });

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedJobs = sortedJobs.slice(startIndex, startIndex + PAGE_SIZE);

  const isOverrunning = (job: JobData) => {
    const effectiveDuration = getEffectiveDurationSecs(job);
    return (
      effectiveDuration !== null &&
      job.avg_duration_secs &&
      effectiveDuration > job.avg_duration_secs * 1.5
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Avg Duration</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Datasource</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                pagedJobs.map((job) => {
                  const percent = getProgressPercent(job);
                  const { fill, text, label, width, container } = getProgressVisual(percent);
                  const durationSeconds = getEffectiveDurationSecs(job);
                  const etaDisplay = getEtaDisplay(job);

                  return (
                    <TableRow key={`${job.job_id}-${job.run_id}`}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {job.job_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.job_platform}</Badge>
                      </TableCell>
                      <TableCell>{job.domain_name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(job.job_status)}>
                          {job.job_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.job_start_time_utc && job.job_start_time_utc !== '-'
                          ? format(new Date(job.job_start_time_utc), 'MMM dd HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.job_end_time_utc && job.job_end_time_utc !== '-'
                          ? format(new Date(job.job_end_time_utc), 'MMM dd HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`relative h-9 w-44 rounded-md border border-gray-200 overflow-hidden ${isOverrunning(job) ? 'ring-1 ring-red-300' : ''}`}
                              aria-label={`Progress ${label}`}
                            >
                              <div className={`absolute inset-0 ${container}`} />
                              <div
                                className="absolute inset-y-0 left-0"
                                style={{ width: `${width}%`, background: fill, transition: 'width 150ms ease' }}
                              />
                              <div className="relative z-10 flex h-full items-center justify-center px-2 text-xs font-semibold">
                                <span className={text}>{label}</span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs" sideOffset={6}>
                            <div className="space-y-1 text-left">
                              <div className="font-semibold">Progress</div>
                              <div>Percent: {label}</div>
                              <div>Elapsed: {formatSeconds(durationSeconds)}</div>
                              <div>Avg: {formatSeconds(job.avg_duration_secs)}</div>
                              <div>ETA: {etaDisplay}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{etaDisplay}</TableCell>
                      <TableCell className="text-gray-600">
                        {formatSeconds(job.avg_duration_secs)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {job.parent_pipeline || '-'}
                      </TableCell>
                      <TableCell>{job.datasource_name || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {pagedJobs.length} of {sortedJobs.length} filtered jobs
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹ Prev
            </Button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next ›
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
