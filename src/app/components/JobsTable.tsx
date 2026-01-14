import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { JobData } from '../../types/dashboard';
import { getStatusBadgeColor, getEffectiveDurationSecs } from '../../utils/metrics';
import { format } from 'date-fns';
import { Filter, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';


interface JobsTableProps {
  jobs: JobData[];
  title?: string;
}

type SortKey =
  | 'job_name'
  | 'job_platform'
  | 'domain_name'
  | 'job_status'
  | 'job_start_time_utc'
  | 'job_end_time_utc'
  | 'progress'
  | 'eta'
  | 'avg_duration_secs'
  | 'parent_pipeline'
  | 'datasource_name';

export function JobsTable({ jobs, title = 'All Jobs' }: JobsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>('job_start_time_utc');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datasourceFilter, setDatasourceFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');

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
        text: 'text-gray-700 dark:text-slate-200',
        label: '-',
        width: 0,
        container: 'bg-white dark:bg-slate-800/60',
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

  const distinct = useMemo(() => {
    const platforms = new Set<string>();
    const domains = new Set<string>();
    const statuses = new Set<string>();
    const datasources = new Set<string>();
    const pipelines = new Set<string>();
    jobs.forEach((job) => {
      if (job.job_platform) platforms.add(job.job_platform);
      if (job.domain_name) domains.add(job.domain_name);
      if (job.job_status) statuses.add(job.job_status);
      if (job.datasource_name) datasources.add(job.datasource_name);
      if (job.parent_pipeline) pipelines.add(job.parent_pipeline);
    });
    return {
      platforms: Array.from(platforms).sort(),
      domains: Array.from(domains).sort(),
      statuses: Array.from(statuses).sort(),
      datasources: Array.from(datasources).sort(),
      pipelines: Array.from(pipelines).sort(),
    };
  }, [jobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlatform = platformFilter === 'all' || job.job_platform === platformFilter;
    const matchesDomain = domainFilter === 'all' || job.domain_name === domainFilter;
    const matchesStatus = statusFilter === 'all' || job.job_status === statusFilter;
    const matchesDatasource = datasourceFilter === 'all' || job.datasource_name === datasourceFilter;
    const matchesPipeline = pipelineFilter === 'all' || job.parent_pipeline === pipelineFilter;

    return matchesSearch && matchesPlatform && matchesDomain && matchesStatus && matchesDatasource && matchesPipeline;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, jobs, platformFilter, domainFilter, statusFilter, datasourceFilter, pipelineFilter, pageSize]);

  const parseStartTime = (value: string) => {
    if (!value || value === '-') return 0;
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? 0 : ts;
  };

  const getEtaMs = (job: JobData) => {
    if (!job.avg_duration_secs) return 0;
    const start = parseStartTime(job.job_start_time_utc);
    return start ? start + job.avg_duration_secs * 1.25 * 1000 : 0;
  };

  const getSortValue = (job: JobData, key: SortKey) => {
    switch (key) {
      case 'job_name':
        return job.job_name || '';
      case 'job_platform':
        return job.job_platform || '';
      case 'domain_name':
        return job.domain_name || '';
      case 'job_status':
        return job.job_status || '';
      case 'job_start_time_utc':
        return parseStartTime(job.job_start_time_utc);
      case 'job_end_time_utc':
        return parseStartTime(job.job_end_time_utc);
      case 'progress': {
        const p = getProgressPercent(job);
        return p === null ? -1 : p;
      }
      case 'eta':
        return getEtaMs(job);
      case 'avg_duration_secs':
        return job.avg_duration_secs || 0;
      case 'parent_pipeline':
        return job.parent_pipeline || '';
      case 'datasource_name':
        return job.datasource_name || '';
      default:
        return '';
    }
  };

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pagedJobs = sortedJobs.slice(startIndex, startIndex + pageSize);

  const isOverrunning = (job: JobData) => {
    const effectiveDuration = getEffectiveDurationSecs(job);
    return (
      effectiveDuration !== null &&
      job.avg_duration_secs &&
      effectiveDuration > job.avg_duration_secs * 1.5
    );
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortLabel = ({ label, keyName }: { label: string; keyName: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(keyName)}
      className="flex items-center gap-1 text-left"
    >
      <span>{label}</span>
      <span className="text-xs text-gray-500">
        {sortKey === keyName ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </span>
    </button>
  );

  const FilterControl = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (val: string) => void;
    options: string[];
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-gray-400 hover:text-emerald-600 transition"
          title="Filter"
        >
          <Filter className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 space-y-1">
        <button
          className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-emerald-50 ${value === 'all' ? 'bg-emerald-50 text-emerald-700' : ''}`}
          onClick={() => onChange('all')}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-emerald-50 ${value === opt ? 'bg-emerald-50 text-emerald-700' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );

  return (
    <Card className="bg-white dark:bg-[#111827] dark:border-slate-700">
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
                <TableHead><SortLabel label="Job Name" keyName="job_name" /></TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <SortLabel label="Platform" keyName="job_platform" />
                    <FilterControl
                      value={platformFilter}
                      onChange={(v) => setPlatformFilter(v)}
                      options={distinct.platforms}
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <SortLabel label="Domain" keyName="domain_name" />
                    <FilterControl
                      value={domainFilter}
                      onChange={(v) => setDomainFilter(v)}
                      options={distinct.domains}
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <SortLabel label="Status" keyName="job_status" />
                    <FilterControl
                      value={statusFilter}
                      onChange={(v) => setStatusFilter(v)}
                      options={distinct.statuses}
                    />
                  </div>
                </TableHead>
                <TableHead><SortLabel label="Start Time" keyName="job_start_time_utc" /></TableHead>
                <TableHead><SortLabel label="End Time" keyName="job_end_time_utc" /></TableHead>
                <TableHead>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <SortLabel label="Pacing %" keyName="progress" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      <div className="max-w-xs space-y-1">
                        <div className="font-semibold">Pacing %</div>
                        <div className="text-sm">
                          Elapsed runtime vs average. 100% = on average, &gt;100% = overrunning, &lt;100% = faster than average.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead><SortLabel label="ETA" keyName="eta" /></TableHead>
                <TableHead><SortLabel label="Avg Duration" keyName="avg_duration_secs" /></TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <SortLabel label="Pipeline" keyName="parent_pipeline" />
                    <FilterControl
                      value={pipelineFilter}
                      onChange={(v) => setPipelineFilter(v)}
                      options={distinct.pipelines}
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <SortLabel label="Datasource" keyName="datasource_name" />
                    <FilterControl
                      value={datasourceFilter}
                      onChange={(v) => setDatasourceFilter(v)}
                      options={distinct.datasources}
                    />
                  </div>
                </TableHead>
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
                              className={`relative h-9 w-44 rounded-md border border-gray-200 overflow-hidden ${isOverrunning(job) ? 'ring-1 ring-red-300' : ''} dark:border-slate-700`}
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
                          <TooltipContent className="max-w-xs dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" sideOffset={6}>
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
                      <TableCell className="text-sm text-gray-700 dark:text-slate-200">{etaDisplay}</TableCell>
                      <TableCell className="text-gray-600 dark:text-slate-300">
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
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-600 flex-wrap dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-slate-200">Rows per page</span>
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-blue-400"
              value={pageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                setPageSize(nextSize);
                setPage(1);
              }}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
}
