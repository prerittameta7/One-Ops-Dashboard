import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { DashboardPage } from './components/DashboardPage';
import { FilterSidebar } from './components/FilterSidebar';
import { RefreshCw, Calendar, Loader } from 'lucide-react';
import { JobData, Bulletin, DOMAINS, Incident, DomainHistoryPoint, DomainIncidentHistoryPoint } from '../types/dashboard';
import { calculateMetrics, calculatePlatformMetrics } from '../utils/metrics';
import { fetchJobs, fetchBulletins, saveBulletin, deleteBulletin, fetchIncidents, addIncident, refreshIncidents, archiveIncident, restoreIncident, deleteIncidentPermanently, fetchHistory } from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allJobs, setAllJobs] = useState<JobData[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [history, setHistory] = useState<DomainHistoryPoint[]>([]);
  const [incidentHistory, setIncidentHistory] = useState<DomainIncidentHistoryPoint[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('all');

  // Fetch initial data
  useEffect(() => {
    loadBulletins();
    loadIncidents();
  }, []);

  // Reload jobs when date changes
  useEffect(() => {
    if (selectedDate) {
      loadJobs();
      loadHistory();
    }
  }, [selectedDate]);

  const loadJobs = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetchJobs({ selectedDate: dateStr, clearCache: forceRefresh });
      const isCached = response?.cached === true;
      setAllJobs(response.data || []);
      setLastRefresh(new Date());

      if (!isCached) {
        toast.success(`Loaded ${response.data?.length || 0} jobs`);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs. Check backend connection.');
      // Use mock data for development
      setAllJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBulletins = async () => {
    try {
      const response = await fetchBulletins();
      setBulletins(response.bulletins || []);
    } catch (error) {
      console.error('Error loading bulletins:', error);
      setBulletins([]);
    }
  };

  const handleRefresh = () => {
    loadJobs(true); // force refresh bypassing cache
    loadHistory();
  };

  const loadIncidents = async (refresh = false) => {
    try {
      const response = await fetchIncidents(refresh);
      setIncidents(response.incidents || []);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Failed to load incidents');
      setIncidents([]);
    }
  };

  const loadHistory = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetchHistory(dateStr);
      setHistory(response.history || []);
      setIncidentHistory(response.incidents || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setIncidentHistory([]);
    }
  };

  const handleAddIncident = async (incidentKey: string, domain: string) => {
    try {
      const response = await addIncident({ incidentKey, domain });
      setIncidents(response.incidents || []);
      toast.success(`Incident ${incidentKey} added`);
    } catch (error: any) {
      console.error('Error adding incident:', error);
      toast.error(error?.message || 'Failed to add incident');
      throw error;
    }
  };

  const handleRefreshIncidents = async () => {
    try {
      const response = await refreshIncidents();
      setIncidents(response.incidents || []);
      toast.success('Incidents refreshed');
    } catch (error: any) {
      console.error('Error refreshing incidents:', error);
      toast.error(error?.message || 'Failed to refresh incidents');
      throw error;
    }
  };

  const handleArchiveIncident = async (key: string) => {
    try {
      const response = await archiveIncident(key);
      setIncidents(response.incidents || []);
      toast.success(`Incident ${key} moved to archive`);
    } catch (error: any) {
      console.error('Error archiving incident:', error);
      toast.error(error?.message || 'Failed to archive incident');
      throw error;
    }
  };

  const handleRestoreIncident = async (key: string) => {
    try {
      const response = await restoreIncident(key);
      setIncidents(response.incidents || []);
      toast.success(`Incident ${key} restored`);
    } catch (error: any) {
      console.error('Error restoring incident:', error);
      toast.error(error?.message || 'Failed to restore incident');
      throw error;
    }
  };

  const handleDeleteIncidentForever = async (key: string) => {
    try {
      const response = await deleteIncidentPermanently(key);
      setIncidents(response.incidents || []);
      toast.success(`Incident ${key} deleted permanently`);
    } catch (error: any) {
      console.error('Error permanently deleting incident:', error);
      toast.error(error?.message || 'Failed to delete incident permanently');
      throw error;
    }
  };

  const handleSaveBulletin = async (message: string) => {
    try {
      const response = await saveBulletin({ message, createdBy: 'Data Ops Team' });
      setBulletins(response.bulletins || []);
      toast.success('Bulletin saved successfully');
    } catch (error) {
      console.error('Error saving bulletin:', error);
      toast.error('Failed to save bulletin');
      throw error;
    }
  };

  const handleDeleteBulletin = async (id: string) => {
    try {
      const response = await deleteBulletin(id);
      setBulletins(response.bulletins || []);
      toast.success('Bulletin deleted');
    } catch (error) {
      console.error('Error deleting bulletin:', error);
      toast.error('Failed to delete bulletin');
      throw error;
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsFilterOpen(false);
    }
  };

  // Filter jobs by domain
  const getJobsByDomain = (domain: string) => {
    if (domain === 'all') return allJobs;
    return allJobs.filter(job => 
      job.domain_name.toLowerCase() === domain.toLowerCase()
    );
  };

  // Calculate metrics for current view
  const getCurrentJobs = () => getJobsByDomain(activeTab);
  const currentJobs = getCurrentJobs();
  const activeIncidents = incidents.filter((incident) => !incident.archivedAt);
  const metrics = {
    ...calculateMetrics(currentJobs),
    incidents: activeIncidents.length
  };
  const platformMetrics = calculatePlatformMetrics(currentJobs);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-slate-50 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-4 lg:py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span
                  className="heartbeat-dot h-12 w-12 rounded-full flex-none mt-1"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight">One Ops Dashboard</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Data Platform
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
                      Data Ops
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">
                    Data Reliability, Observability &amp; Trust - Unified.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-right shadow-lg shadow-slate-900/20">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Last refreshed</p>
                  <p className="text-sm font-semibold text-white">
                    {format(lastRefresh, "MMM dd, yyyy HH:mm:ss 'IST'")}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10 rounded-xl border border-white/50 bg-white text-slate-900 shadow-sm transition hover:bg-slate-100"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'MMM dd, yyyy')}
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    size="sm"
                    className="h-10 rounded-xl border border-emerald-300/70 bg-emerald-400 text-slate-900 shadow-sm transition hover:bg-emerald-300 active:bg-emerald-500"
                  >
                    {isLoading ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">All Domains</TabsTrigger>
            {DOMAINS.map(domain => (
              <TabsTrigger key={domain} value={domain.toLowerCase()}>
                {domain}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <DashboardPage
              jobs={currentJobs}
              metrics={metrics}
              platformMetrics={platformMetrics}
              bulletins={bulletins}
              incidents={incidents}
              history={history}
              incidentHistory={incidentHistory}
              onAddIncident={handleAddIncident}
              onRefreshIncidents={handleRefreshIncidents}
              onArchiveIncident={handleArchiveIncident}
              onRestoreIncident={handleRestoreIncident}
              onDeleteIncidentForever={handleDeleteIncidentForever}
              onSaveBulletin={handleSaveBulletin}
              onDeleteBulletin={handleDeleteBulletin}
            />
          </TabsContent>

          {DOMAINS.map(domain => (
            <TabsContent key={domain} value={domain.toLowerCase()} className="mt-0">
              <DashboardPage
                jobs={currentJobs}
                metrics={metrics}
                platformMetrics={platformMetrics}
                bulletins={bulletins}
                incidents={incidents}
              history={history}
              incidentHistory={incidentHistory}
                onAddIncident={handleAddIncident}
                onRefreshIncidents={handleRefreshIncidents}
                onArchiveIncident={handleArchiveIncident}
                onRestoreIncident={handleRestoreIncident}
                onDeleteIncidentForever={handleDeleteIncidentForever}
                onSaveBulletin={handleSaveBulletin}
                onDeleteBulletin={handleDeleteBulletin}
                domain={domain}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
    </div>
  );
}