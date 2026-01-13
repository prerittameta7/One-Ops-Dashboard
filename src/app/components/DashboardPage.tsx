import React, { useEffect, useMemo, useRef, useState } from 'react';
import { JobData, DashboardMetrics, PlatformMetrics, Bulletin, Incident, DOMAINS, DomainHistoryPoint, DomainIncidentHistoryPoint } from '../../types/dashboard';
import { KPICard } from './KPICard';
import { PlatformChart } from './PlatformChart';
import { CriticalInfoBox } from './CriticalInfoBox';
import { JobsTable } from './JobsTable';
import { CircleCheck, Clock, TriangleAlert, Trash2, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getEffectiveDurationSecs } from '../../utils/metrics';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const JIRA_HOST = (import.meta as any).env?.VITE_JIRA_HOST || 'teamfox.atlassian.net';

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#10b981',
  FAILED: '#ef4444',
  RUNNING: '#3b82f6',
  PENDING: '#eab308',
  QUEUED: '#f97316',
  UNKNOWN: '#6b7280',
};

const INCIDENT_COLORS: Record<string, string> = {
  New: '#ef4444',
  Open: '#f97316',
  Dev: '#3b82f6',
  'In Progress': '#3b82f6',
  UAT: '#8b5cf6',
  Resolved: '#10b981',
  Done: '#10b981',
  Closed: '#10b981',
  Unknown: '#9ca3af',
};

type TrendPoint = { date: string; healthPct: number | null; failureRate: number };

interface DomainHealthProps {
  label: string;
  statusData: { name: string; value: number; color: string }[];
  incidentData: { name: string; value: number; color: string }[];
  totalJobs: number;
  totalIncidents: number;
  health: number | null;
  delta: number | null;
  anomaly: boolean;
  trend: TrendPoint[];
}

const DomainHealthCard = React.memo(function DomainHealthCard({
  label,
  statusData,
  incidentData,
  totalJobs,
  totalIncidents,
  health,
  delta,
  anomaly,
  trend
}: DomainHealthProps) {
  const hasAnimatedRef = useRef(false);
  const hasAnimatedIncidentsRef = useRef(false);

  useEffect(() => {
    if (totalJobs > 0) hasAnimatedRef.current = true;
  }, [totalJobs]);

  useEffect(() => {
    if (totalIncidents > 0) hasAnimatedIncidentsRef.current = true;
  }, [totalIncidents]);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          {anomaly && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              Anomaly
            </span>
          )}
        </div>
        {delta !== null && (
          <span className={`text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {delta >= 0 ? '+' : ''}{delta}% vs yesterday
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500 mb-2">Job</div>
          {totalJobs === 0 ? (
            <div className="text-sm text-gray-500">No data</div>
          ) : (
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius={40}
                  outerRadius={60}
                  stroke="none"
                  isAnimationActive={!hasAnimatedRef.current}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                  <RechartsTooltip
                    content={({ active }) => {
                      if (!active) return null;
                      return (
                        <div className="rounded-md border bg-white p-2 shadow-sm text-xs">
                          <div className="font-semibold mb-1">Status breakdown</div>
                          {statusData.map((s) => (
                            <div key={s.name} className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                              <span className="flex-1">{s.name}</span>
                              <span>{s.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-1 text-lg font-semibold">
            {health === null ? '–' : `${health}%`}
          </div>
          <div className="text-xs text-gray-500">Health</div>
        </div>

        <div className="col-span-1 flex flex-col gap-3">
          <div className="h-6" aria-hidden="true" />
          <div>
            <div className="text-xs text-gray-500 mb-1">Incidents</div>
            {totalIncidents === 0 ? (
              <div className="text-xs text-gray-500">No incidents</div>
            ) : (
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie
                      data={incidentData}
                      dataKey="value"
                      innerRadius={24}
                      outerRadius={36}
                      stroke="none"
                      isAnimationActive={!hasAnimatedIncidentsRef.current}
                    >
                      {incidentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                      <RechartsTooltip
                        content={({ active }) => {
                          if (!active) return null;
                          return (
                            <div className="rounded-md border bg-white p-2 shadow-sm text-xs">
                              <div className="font-semibold mb-1">Incidents breakdown</div>
                              {incidentData.map((s) => (
                                <div key={s.name} className="flex items-center gap-2">
                                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                                  <span className="flex-1">{s.name}</span>
                                  <span>{s.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                  </PieChart>
                </ResponsiveContainer>
                <span className="text-sm font-semibold">{totalIncidents} active</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1">
          <div className="text-xs text-gray-500 mb-1">7-day trend</div>
          {trend.length === 0 ? (
            <div className="text-xs text-gray-500">No trend data</div>
          ) : (
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={trend}>
                <Line
                  type="monotone"
                  dataKey="healthPct"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
});


interface DashboardPageProps {
  jobs: JobData[];
  metrics: DashboardMetrics;
  platformMetrics: PlatformMetrics[];
  bulletins: Bulletin[];
  incidents: Incident[];
  onAddIncident: (incidentKey: string, domain: string) => Promise<void>;
  onRefreshIncidents: () => Promise<void>;
  onArchiveIncident: (incidentKey: string) => Promise<void>;
  onRestoreIncident: (incidentKey: string) => Promise<void>;
  onDeleteIncidentForever: (incidentKey: string) => Promise<void>;
  onSaveBulletin: (message: string) => Promise<void>;
  onDeleteBulletin: (id: string) => Promise<void>;
  history: DomainHistoryPoint[];
  incidentHistory: DomainIncidentHistoryPoint[];
  domain?: string;
}

type IncidentSortKey =
  | 'domain'
  | 'key'
  | 'title'
  | 'issueType'
  | 'status'
  | 'assignee'
  | 'reporter'
  | 'created'
  | 'updated'
  | 'lastComment';

export function DashboardPage({
  jobs,
  metrics,
  platformMetrics,
  bulletins,
  incidents,
  history,
  incidentHistory,
  onAddIncident,
  onRefreshIncidents,
  onArchiveIncident,
  onRestoreIncident,
  onDeleteIncidentForever,
  onSaveBulletin,
  onDeleteBulletin,
  domain
}: DashboardPageProps) {
  const [jobTab, setJobTab] = useState<'all' | 'overrunning' | 'incidents'>('all');
  const jobsSectionRef = useRef<HTMLDivElement | null>(null);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [incidentKeyInput, setIncidentKeyInput] = useState('');
  const [incidentDomain, setIncidentDomain] = useState<string>('AdSales');
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [isRefreshingIncidents, setIsRefreshingIncidents] = useState(false);
  const [archivingIncidentKey, setArchivingIncidentKey] = useState<string | null>(null);
  const [restoringIncidentKey, setRestoringIncidentKey] = useState<string | null>(null);
  const [permanentlyDeletingIncidentKey, setPermanentlyDeletingIncidentKey] = useState<string | null>(null);
  const [incidentView, setIncidentView] = useState<'active' | 'archived'>('active');
  const [confirmAction, setConfirmAction] = useState<{ mode: 'archive' | 'permanent'; incident: Incident } | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(20);
  const [archivedPageSize, setArchivedPageSize] = useState(20);
  const [activeSort, setActiveSort] = useState<{ key: IncidentSortKey; dir: 'asc' | 'desc' }>({
    key: 'updated',
    dir: 'desc'
  });
  const [archivedSort, setArchivedSort] = useState<{ key: IncidentSortKey; dir: 'asc' | 'desc' }>({
    key: 'updated',
    dir: 'desc'
  });
  const [domainFilter, setDomainFilter] = useState('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [reporterFilter, setReporterFilter] = useState('all');

  const activeIncidents = useMemo(
    () => incidents.filter((incident) => !incident.archivedAt),
    [incidents]
  );

  const archivedIncidents = useMemo(
    () => incidents.filter((incident) => incident.archivedAt),
    [incidents]
  );

  const incidentFilters = useMemo(() => {
    const domains = new Set<string>();
    const issueTypes = new Set<string>();
    const statuses = new Set<string>();
    const assignees = new Set<string>();
    const reporters = new Set<string>();
    incidents.forEach((inc) => {
      if (inc.domain) domains.add(inc.domain);
      if (inc.issueType) issueTypes.add(inc.issueType);
      if (inc.status) statuses.add(inc.status);
      if (inc.assignee) assignees.add(inc.assignee);
      if (inc.reporter) reporters.add(inc.reporter);
    });
    return {
      domains: Array.from(domains).sort(),
      issueTypes: Array.from(issueTypes).sort(),
      statuses: Array.from(statuses).sort(),
      assignees: Array.from(assignees).sort(),
      reporters: Array.from(reporters).sort(),
    };
  }, [incidents]);

  const passesFilters = (inc: Incident) => {
    const matchesDomain =
      domainFilter === 'all' || (inc.domain || '').toLowerCase() === domainFilter.toLowerCase();
    const matchesIssueType = issueTypeFilter === 'all' || inc.issueType === issueTypeFilter;
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' || inc.assignee === assigneeFilter;
    const matchesReporter = reporterFilter === 'all' || inc.reporter === reporterFilter;
    return matchesDomain && matchesIssueType && matchesStatus && matchesAssignee && matchesReporter;
  };

  const incidentsForView = useMemo(() => {
    const list = domain
      ? activeIncidents.filter((inc) => inc.domain?.toLowerCase() === domain.toLowerCase())
      : activeIncidents;
    return list.filter(passesFilters);
  }, [activeIncidents, domain, domainFilter, issueTypeFilter, assigneeFilter, reporterFilter]);

  const archivedIncidentsForView = useMemo(() => {
    const list = domain
      ? archivedIncidents.filter((inc) => inc.domain?.toLowerCase() === domain.toLowerCase())
      : archivedIncidents;
    return list.filter(passesFilters);
  }, [archivedIncidents, domain, domainFilter, issueTypeFilter, assigneeFilter, reporterFilter]);

  const getIncidentSortValue = (incident: Incident, key: IncidentSortKey) => {
    switch (key) {
      case 'domain':
        return incident.domain || '';
      case 'key':
        return incident.key || '';
      case 'title':
        return incident.title || '';
      case 'issueType':
        return incident.issueType || '';
      case 'status':
        return incident.status || '';
      case 'assignee':
        return incident.assignee || '';
      case 'reporter':
        return incident.reporter || '';
      case 'created':
        return incident.created ? new Date(incident.created).getTime() : 0;
      case 'updated':
        return incident.updated ? new Date(incident.updated).getTime() : 0;
      case 'lastComment':
        return incident.lastComment?.body || '';
      default:
        return '';
    }
  };

  const sortIncidents = (items: Incident[], key: IncidentSortKey, dir: 'asc' | 'desc') => {
    return [...items].sort((a, b) => {
      const aVal = getIncidentSortValue(a, key);
      const bVal = getIncidentSortValue(b, key);
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return dir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const sortedActiveIncidents = useMemo(
    () => sortIncidents(incidentsForView, activeSort.key, activeSort.dir),
    [incidentsForView, activeSort]
  );

  const sortedArchivedIncidents = useMemo(
    () => sortIncidents(archivedIncidentsForView, archivedSort.key, archivedSort.dir),
    [archivedIncidentsForView, archivedSort]
  );

  // Pagination helpers for incidents
  const paginate = (items: Incident[], page: number, pageSize: number) => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const startIndex = (page - 1) * pageSize;
    return {
      totalPages,
      pageItems: items.slice(startIndex, startIndex + pageSize),
    };
  };

  const {
    totalPages: activeTotalPages,
    pageItems: activePageItems,
  } = paginate(sortedActiveIncidents, activePage, activePageSize);

  const {
    totalPages: archivedTotalPages,
    pageItems: archivedPageItems,
  } = paginate(sortedArchivedIncidents, archivedPage, archivedPageSize);

  useEffect(() => {
    setActivePage(1);
    setArchivedPage(1);
  }, [domainFilter, issueTypeFilter, statusFilter, assigneeFilter, reporterFilter]);

  const incidentStatusSummary = useMemo(() => {
    if (!incidentsForView.length) return 'No active incidents';

    const counts = incidentsForView.reduce<Record<string, number>>((acc, incident) => {
      const status = (incident.status || 'Unknown').trim();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const preferredOrder = ['New', 'Dev', 'UAT'];
    const orderedStatuses = [
      ...preferredOrder.filter((status) => counts[status]),
      ...Object.keys(counts)
        .filter((status) => !preferredOrder.includes(status))
        .sort()
    ];

    return orderedStatuses.map((status) => `${status}: ${counts[status]}`).join(' | ');
  }, [incidentsForView]);

  const isOverrunning = (job: JobData) => {
    const effectiveDuration = getEffectiveDurationSecs(job);
    return (
      effectiveDuration !== null &&
      job.avg_duration_secs &&
      effectiveDuration > job.avg_duration_secs * 1.5
    );
  };

  const overrunningJobs = useMemo(
    () => jobs.filter(isOverrunning),
    [jobs]
  );

  const norm = (d: string | null | undefined) => (d || '').toLowerCase();

  const groupJobsByDomain = () => {
    const map = new Map<string, JobData[]>();
    jobs.forEach((job) => {
      const d = norm(job.domain_name);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(job);
    });
    return map;
  };

  const domainJobsMap = useMemo(groupJobsByDomain, [jobs]);

  const historyByDomain = useMemo(() => {
    const map = new Map<string, DomainHistoryPoint[]>();
    history.forEach((h) => {
      const key = norm(h.domain_name);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return map;
  }, [history]);

  const incidentHistoryByDomain = useMemo(() => {
    const map = new Map<string, DomainIncidentHistoryPoint[]>();
    incidentHistory.forEach((h) => {
      const key = norm(h.domain);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return map;
  }, [incidentHistory]);

  const computeHealth = (domain: string | null) => {
    const domainKey = domain ? norm(domain) : null;
    const domainJobs = domainKey ? domainJobsMap.get(domainKey) || [] : jobs;
    const total = domainJobs.length;
    const failed = domainJobs.filter((j) => j.job_status === 'FAILED').length;
    if (total === 0) return null;
    return Math.max(0, Math.round(100 * (1 - failed / total)));
  };

  const buildStatusMix = (domain: string | null) => {
    const domainKey = domain ? norm(domain) : null;
    const domainJobs = domainKey ? domainJobsMap.get(domainKey) || [] : jobs;
    const counts: Record<string, number> = {};
    domainJobs.forEach((j) => {
      counts[j.job_status] = (counts[j.job_status] || 0) + 1;
    });
    return counts;
  };

  const buildIncidentMix = (domain: string | null) => {
    const domainIncidents = incidents.filter((inc) =>
      domain ? norm(inc.domain) === norm(domain) : true
    );
    const counts: Record<string, number> = {};
    domainIncidents.forEach((inc) => {
      const status = inc.status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const buildHistorySeries = (domain: string | null) => {
    const domainKey = domain ? norm(domain) : null;
    const points = domainKey ? historyByDomain.get(domainKey) || [] : history;
    const byDate = new Map<string, { failed: number; total: number }>();
    points.forEach((p) => {
      const rec = byDate.get(p.job_date) || { failed: 0, total: 0 };
      rec.total += p.count;
      if (p.job_status === 'FAILED') rec.failed += p.count;
      byDate.set(p.job_date, rec);
    });
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, rec]) => ({
        date,
        failureRate: rec.total ? rec.failed / rec.total : 0,
        health: rec.total ? 1 - rec.failed / rec.total : null,
      }));
  };

  const getDeltaVsYesterday = (series: { date: string; health: number | null }[]) => {
    if (series.length < 2) return null;
    const last = series[series.length - 1].health;
    const prev = series[series.length - 2].health;
    if (last === null || prev === null) return null;
    return Math.round((last - prev) * 100);
  };

  const getAnomalyFlag = (series: { health: number | null; failureRate: number }[]) => {
    if (!series.length) return false;
    const today = series[series.length - 1];
    if (today.health === null) return false;
    const rates = series
      .map((p) => p.failureRate)
      .filter((r) => Number.isFinite(r))
      .sort((a, b) => a - b);
    if (!rates.length) return false;
    const mid = Math.floor(rates.length / 2);
    const median = rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
    return today.failureRate > median * 1.2;
  };

  const buildDomainView = (dKey: string | null) => {
    const health = computeHealth(dKey);
    const statusMix = buildStatusMix(dKey);
    const incidentMix = buildIncidentMix(dKey);
    const historySeries = buildHistorySeries(dKey);
    const delta = getDeltaVsYesterday(historySeries);
    const anomaly = getAnomalyFlag(historySeries);

    const statusData = Object.keys(statusMix).map((key) => ({
      name: key,
      value: statusMix[key],
      color: STATUS_COLORS[key] || '#94a3b8'
    }));

    const incidentData = Object.keys(incidentMix).map((key) => ({
      name: key,
      value: incidentMix[key],
      color: INCIDENT_COLORS[key] || '#9ca3af'
    }));

    const totalJobs = Object.values(statusMix).reduce((a, b) => a + b, 0);
    const totalIncidents = Object.values(incidentMix).reduce((a, b) => a + b, 0);
    const trend: TrendPoint[] = historySeries.map((p) => ({
      date: p.date,
      failureRate: p.failureRate,
      healthPct: p.health !== null ? p.health * 100 : null,
    }));

    return { health, statusData, incidentData, totalJobs, totalIncidents, delta, anomaly, trend };
  };


  const scrollToJobs = (tab: 'all' | 'overrunning' | 'incidents') => {
    setJobTab(tab);
    requestAnimationFrame(() => {
      if (jobsSectionRef.current) {
        jobsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleSubmitIncident = async () => {
    if (!incidentKeyInput.trim()) {
      return;
    }
    setIsAddingIncident(true);
    try {
      await onAddIncident(incidentKeyInput.trim(), incidentDomain);
      setIncidentKeyInput('');
      setIsIncidentDialogOpen(false);
      setJobTab('incidents');
    } catch (e) {
      // errors are already toasted upstream
    } finally {
      setIsAddingIncident(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('done') || s.includes('resolved') || s.includes('closed')) return 'bg-green-100 text-green-800';
    if (s.includes('in progress') || s.includes('working')) return 'bg-blue-100 text-blue-800';
    if (s.includes('uat') || s.includes('qa')) return 'bg-indigo-100 text-indigo-800';
    if (s.includes('todo') || s.includes('new') || s.includes('open')) return 'bg-gray-100 text-gray-800';
    return 'bg-amber-100 text-amber-800';
  };

  const handleRefreshIncidentsClick = async () => {
    setIsRefreshingIncidents(true);
    try {
      await onRefreshIncidents();
    } catch (e) {
      // already toasted
    } finally {
      setIsRefreshingIncidents(false);
    }
  };

  const handleArchiveIncidentRequest = (incident: Incident) => {
    setConfirmAction({ mode: 'archive', incident });
  };

  const handleDeleteForeverRequest = (incident: Incident) => {
    setConfirmAction({ mode: 'permanent', incident });
  };

  const handleConfirmIncidentAction = async () => {
    if (!confirmAction) return;
    const incidentKey = confirmAction.incident.key;

    if (confirmAction.mode === 'archive') {
      setArchivingIncidentKey(incidentKey);
      try {
        await onArchiveIncident(incidentKey);
        setIncidentView('archived');
      } catch (e) {
        // toast handled upstream
      } finally {
        setArchivingIncidentKey(null);
        setConfirmAction(null);
      }
    } else {
      setPermanentlyDeletingIncidentKey(incidentKey);
      try {
        await onDeleteIncidentForever(incidentKey);
      } catch (e) {
        // toast handled upstream
      } finally {
        setPermanentlyDeletingIncidentKey(null);
        setConfirmAction(null);
      }
    }
  };

  const handleRestoreIncidentClick = async (incidentKey: string) => {
    setRestoringIncidentKey(incidentKey);
    try {
      await onRestoreIncident(incidentKey);
      setIncidentView('active');
    } catch (e) {
      // toast handled upstream
    } finally {
      setRestoringIncidentKey(null);
    }
  };

  const toggleActiveSort = (key: IncidentSortKey) => {
    setActiveSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setActivePage(1);
  };

  const toggleArchivedSort = (key: IncidentSortKey) => {
    setArchivedSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setArchivedPage(1);
  };

  const SortLabel = ({
    label,
    sortKey,
    mode,
  }: {
    label: string;
    sortKey: IncidentSortKey;
    mode: 'active' | 'archived';
  }) => {
    const state = mode === 'active' ? activeSort : archivedSort;
    const handler = mode === 'active' ? toggleActiveSort : toggleArchivedSort;
    return (
      <button type="button" onClick={() => handler(sortKey)} className="flex items-center gap-1 text-left">
        <span>{label}</span>
        <span className="text-xs text-gray-500">
          {state.key === sortKey ? (state.dir === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    );
  };

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

  const domainsToRender = domain ? [domain] : ['__all__'];

  return (
    <div className="space-y-6">
      {/* Domain Health */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Domain Health</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {domainsToRender.map((d) => (
            (() => {
              const domainKey = d === '__all__' ? null : d;
              const view = buildDomainView(domainKey);
              return (
                <DomainHealthCard
                  key={d}
                  label={d === '__all__' ? 'All Domains' : d}
                  statusData={view.statusData}
                  incidentData={view.incidentData}
                  totalJobs={view.totalJobs}
                  totalIncidents={view.totalIncidents}
                  health={view.health}
                  delta={view.delta}
                  anomaly={view.anomaly}
                  trend={view.trend}
                />
              );
            })()
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Job Status"
          value={metrics.totalJobs}
          icon={CircleCheck}
          description={`Success: ${metrics.successJobs} | Failed: ${metrics.failedJobs} | Running: ${metrics.runningJobs}`}
          iconColor="text-blue-600"
          onClick={() => scrollToJobs('all')}
        />
        <KPICard
          title="Overrunning Jobs"
          value={metrics.overrunningJobs}
          icon={Clock}
          description="Jobs exceeding 1.5x avg runtime"
          iconColor="text-orange-600"
          onClick={() => scrollToJobs('overrunning')}
        />
        <KPICard
          title="Active Incidents"
          value={incidentsForView.length}
          icon={TriangleAlert}
          description={incidentStatusSummary}
          iconColor="text-red-600"
          onClick={() => scrollToJobs('incidents')}
        />
      </div>

      {/* Chart and Critical Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlatformChart data={platformMetrics} />
        </div>
        <div>
          <CriticalInfoBox
            bulletins={bulletins}
            onSave={onSaveBulletin}
            onDelete={onDeleteBulletin}
          />
        </div>
      </div>

      {/* Jobs & Incidents Section */}
      <div ref={jobsSectionRef}>
        <Tabs value={jobTab} onValueChange={(val) => setJobTab(val as typeof jobTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="overrunning">Overrunning</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <JobsTable
              jobs={jobs}
              title={domain ? `${domain} Domain Jobs` : 'All Domain Jobs'}
            />
          </TabsContent>

          <TabsContent value="overrunning" className="mt-0">
            <JobsTable
              jobs={overrunningJobs}
              title={domain ? `${domain} Domain - Overrunning Jobs` : 'Overrunning Jobs'}
            />
          </TabsContent>

          <TabsContent value="incidents" className="mt-0">
            <div className="rounded-lg border bg-white">
              <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold">Incidents</h3>
                  <p className="text-sm text-gray-600">
                    Synced from JIRA · Active: {incidentsForView.length} · Archived: {archivedIncidentsForView.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsIncidentDialogOpen(true)}>
                    + Add Incident
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRefreshIncidentsClick} disabled={isRefreshingIncidents}>
                    {isRefreshingIncidents ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
              <div className="p-4 pt-3">
                <Tabs value={incidentView} onValueChange={(val) => setIncidentView(val as typeof incidentView)} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="active">Active ({incidentsForView.length})</TabsTrigger>
                    <TabsTrigger value="archived">Archived ({archivedIncidentsForView.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-0">
                    <div className="relative w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Domain" sortKey="domain" mode="active" />
                                <FilterControl
                                  value={domainFilter}
                                  onChange={(v) => setDomainFilter(v)}
                                  options={incidentFilters.domains}
                                />
                              </div>
                            </TableHead>
                            <TableHead><SortLabel label="Incident #" sortKey="key" mode="active" /></TableHead>
                            <TableHead><SortLabel label="Title" sortKey="title" mode="active" /></TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Issue Type" sortKey="issueType" mode="active" />
                                <FilterControl
                                  value={issueTypeFilter}
                                  onChange={(v) => setIssueTypeFilter(v)}
                                  options={incidentFilters.issueTypes}
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Status" sortKey="status" mode="active" />
                                <FilterControl
                                  value={statusFilter}
                                  onChange={(v) => setStatusFilter(v)}
                                  options={incidentFilters.statuses}
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Assignee" sortKey="assignee" mode="active" />
                                <FilterControl
                                  value={assigneeFilter}
                                  onChange={(v) => setAssigneeFilter(v)}
                                  options={incidentFilters.assignees}
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Reporter" sortKey="reporter" mode="active" />
                                <FilterControl
                                  value={reporterFilter}
                                  onChange={(v) => setReporterFilter(v)}
                                  options={incidentFilters.reporters}
                                />
                              </div>
                            </TableHead>
                            <TableHead><SortLabel label="Created" sortKey="created" mode="active" /></TableHead>
                            <TableHead><SortLabel label="Updated" sortKey="updated" mode="active" /></TableHead>
                            <TableHead className="w-72">Last Comment</TableHead>
                            <TableHead className="w-28 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incidentsForView.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                                No active incidents
                              </TableCell>
                            </TableRow>
                          ) : (
                            activePageItems.map((incident) => (
                              <TableRow key={incident.key}>
                                <TableCell>{incident.domain || '-'}</TableCell>
                                <TableCell className="font-medium">
                                  <a
                                    className="text-blue-600 hover:underline"
                                    href={`https://${JIRA_HOST}/browse/${incident.key}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {incident.key}
                                  </a>
                                </TableCell>
                                <TableCell className="max-w-md">{incident.title}</TableCell>
                                <TableCell>{incident.issueType}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(incident.status)}`}>
                                    {incident.status}
                                  </span>
                                </TableCell>
                                <TableCell>{incident.assignee || '-'}</TableCell>
                                <TableCell>{incident.reporter || '-'}</TableCell>
                                <TableCell>{incident.created ? new Date(incident.created).toLocaleString() : '-'}</TableCell>
                                <TableCell>{incident.updated ? new Date(incident.updated).toLocaleString() : '-'}</TableCell>
                                <TableCell className="whitespace-pre-wrap break-words max-w-xl">
                                  {incident.lastComment?.body
                                    ? `${incident.lastComment.author ? incident.lastComment.author + ': ' : ''}${incident.lastComment.body}`
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={archivingIncidentKey === incident.key}
                                    onClick={() => handleArchiveIncidentRequest(incident)}
                                    aria-label={`Archive incident ${incident.key}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {incidentsForView.length > 0 && (
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">Rows per page</span>
                          <select
                            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            value={activePageSize}
                            onChange={(e) => {
                              setActivePageSize(Number(e.target.value));
                              setActivePage(1);
                            }}
                          >
                            {[10, 20, 50, 100].map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>
                            Showing {activePageItems.length} of {incidentsForView.length} incidents
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                              disabled={activePage === 1}
                            >
                              ‹ Prev
                            </Button>
                            <span className="text-gray-700">
                              Page {activePage} of {activeTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActivePage((p) => Math.min(activeTotalPages, p + 1))}
                              disabled={activePage === activeTotalPages}
                            >
                              Next ›
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="archived" className="mt-0">
                    <div className="relative w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Domain" sortKey="domain" mode="archived" />
                                <FilterControl
                                  value={domainFilter}
                                  onChange={(v) => setDomainFilter(v)}
                                  options={incidentFilters.domains}
                                />
                              </div>
                            </TableHead>
                            <TableHead><SortLabel label="Incident #" sortKey="key" mode="archived" /></TableHead>
                            <TableHead><SortLabel label="Title" sortKey="title" mode="archived" /></TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Status" sortKey="status" mode="archived" />
                                <FilterControl
                                  value={statusFilter}
                                  onChange={(v) => setStatusFilter(v)}
                                  options={incidentFilters.statuses}
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Assignee" sortKey="assignee" mode="archived" />
                                <FilterControl
                                  value={assigneeFilter}
                                  onChange={(v) => setAssigneeFilter(v)}
                                  options={incidentFilters.assignees}
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <SortLabel label="Reporter" sortKey="reporter" mode="archived" />
                                <FilterControl
                                  value={reporterFilter}
                                  onChange={(v) => setReporterFilter(v)}
                                  options={incidentFilters.reporters}
                                />
                              </div>
                            </TableHead>
                            <TableHead><SortLabel label="Deleted At" sortKey="updated" mode="archived" /></TableHead>
                            <TableHead><SortLabel label="Deleted By" sortKey="assignee" mode="archived" /></TableHead>
                            <TableHead className="w-56 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {archivedIncidentsForView.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                No archived incidents yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            archivedPageItems.map((incident) => (
                              <TableRow key={incident.key}>
                                <TableCell>{incident.domain || '-'}</TableCell>
                                <TableCell className="font-medium">
                                  <a
                                    className="text-blue-600 hover:underline"
                                    href={`https://${JIRA_HOST}/browse/${incident.key}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {incident.key}
                                  </a>
                                </TableCell>
                                <TableCell className="max-w-lg">{incident.title}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(incident.status)}`}>
                                    {incident.status}
                                  </span>
                                </TableCell>
                                <TableCell>{incident.archivedAt ? new Date(incident.archivedAt).toLocaleString() : '-'}</TableCell>
                                <TableCell>{incident.archivedBy || 'Dashboard'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={restoringIncidentKey === incident.key}
                                    onClick={() => handleRestoreIncidentClick(incident.key)}
                                  >
                                    {restoringIncidentKey === incident.key ? 'Restoring...' : 'Restore'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={permanentlyDeletingIncidentKey === incident.key}
                                    onClick={() => handleDeleteForeverRequest(incident)}
                                  >
                                    {permanentlyDeletingIncidentKey === incident.key ? 'Deleting...' : 'Delete permanently'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {archivedIncidentsForView.length > 0 && (
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">Rows per page</span>
                          <select
                            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            value={archivedPageSize}
                            onChange={(e) => {
                              setArchivedPageSize(Number(e.target.value));
                              setArchivedPage(1);
                            }}
                          >
                            {[10, 20, 50, 100].map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>
                            Showing {archivedPageItems.length} of {archivedIncidentsForView.length} incidents
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchivedPage((p) => Math.max(1, p - 1))}
                              disabled={archivedPage === 1}
                            >
                              ‹ Prev
                            </Button>
                            <span className="text-gray-700">
                              Page {archivedPage} of {archivedTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchivedPage((p) => Math.min(archivedTotalPages, p + 1))}
                              disabled={archivedPage === archivedTotalPages}
                            >
                              Next ›
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete / Archive Confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.mode === 'permanent' ? 'Delete incident permanently?' : 'Delete incident?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.mode === 'permanent'
                ? `This will permanently remove ${confirmAction.incident.key}. This action cannot be undone.`
                : `This will move ${confirmAction?.incident.key} to Archive. You can restore it later from the Archived tab.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.mode === 'permanent' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
              onClick={handleConfirmIncidentAction}
              disabled={
                (confirmAction?.mode === 'archive' && archivingIncidentKey === confirmAction?.incident.key) ||
                (confirmAction?.mode === 'permanent' && permanentlyDeletingIncidentKey === confirmAction?.incident.key)
              }
            >
              {confirmAction?.mode === 'permanent'
                ? permanentlyDeletingIncidentKey === confirmAction?.incident.key
                  ? 'Deleting...'
                  : 'Delete permanently'
                : archivingIncidentKey === confirmAction?.incident.key
                  ? 'Deleting...'
                  : 'Delete & Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Incident Dialog */}
      <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Incident (JIRA)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Incident # (JIRA key)</label>
              <Input
                placeholder="e.g., BIADS-12345"
                value={incidentKeyInput}
                onChange={(e) => setIncidentKeyInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain</label>
              <Select value={incidentDomain} onValueChange={setIncidentDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncidentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitIncident} disabled={isAddingIncident || !incidentKeyInput.trim()}>
              {isAddingIncident ? 'Adding...' : 'Add Incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}