import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ticketAPI, agentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  Filter,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  UserCheck,
  Shield,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentBadge } from '../components/DepartmentBadge';
import { SlaBadge } from '../components/SlaBadge';

export const AgentDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'queue'); // 'queue' | 'analytics'
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketAPI.list({
        status: statusFilter,
        urgency: urgencyFilter,
        department: departmentFilter,
        assignedToMe: assignedToMe ? 'true' : undefined,
        search: search || undefined,
      });
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await ticketAPI.getAnalytics();
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await agentAPI.list();
      if (res.data.success) {
        setAgents(res.data.agents);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAnalytics();
    fetchAgents();
  }, [statusFilter, urgencyFilter, departmentFilter, assignedToMe]);

  const handleQuickStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await ticketAPI.updateStatus(ticketId, newStatus);
      if (res.data.success) {
        fetchTickets();
        fetchAnalytics();
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-md">
              Support Desk Operations
            </span>
            <span className="text-xs text-slate-400">Department: {user?.department || 'General'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Agent Command Center
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'queue'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Ticket Queue ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              SLA Analytics
            </button>
          </div>

          <button
            onClick={() => {
              fetchTickets();
              fetchAnalytics();
            }}
            title="Refresh"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
          <div className="glass-card p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">Total Backlog</span>
            <p className="text-xl font-bold text-white mt-1">{analytics.totalTickets}</p>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-sky-500/20 bg-sky-950/20">
            <span className="text-[11px] font-medium text-sky-300">Open Tickets</span>
            <p className="text-xl font-bold text-sky-400 mt-1">{analytics.openTickets}</p>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/20">
            <span className="text-[11px] font-medium text-purple-300">In Progress</span>
            <p className="text-xl font-bold text-purple-400 mt-1">{analytics.inProgressTickets}</p>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20">
            <span className="text-[11px] font-medium text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Critical Active
            </span>
            <p className="text-xl font-bold text-rose-400 mt-1">
              {analytics.urgencyDistribution.CRITICAL}
            </p>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/30">
            <span className="text-[11px] font-medium text-rose-300">SLA Breached</span>
            <p className="text-xl font-bold text-rose-400 mt-1">{analytics.breachedCount}</p>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
            <span className="text-[11px] font-medium text-emerald-300">SLA Compliance</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{analytics.slaComplianceRate}%</p>
          </div>
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Urgency Filter */}
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
                <option value="General">General</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {/* Assigned To Me Toggle */}
              <button
                type="button"
                onClick={() => setAssignedToMe(!assignedToMe)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  assignedToMe
                    ? 'bg-purple-600 text-white border border-purple-500'
                    : 'bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assigned to Me
              </button>
            </div>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchTickets();
              }}
              className="relative w-full sm:w-60"
            >
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search queue..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 text-xs text-white rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </form>
          </div>

          {/* Ticket Queue List */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-400">Loading incoming ticket queue...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-20 text-center glass-card rounded-2xl border border-slate-800 p-8">
              <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No tickets match your filters</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing active urgency, status, or assignment filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <UrgencyBadge urgency={ticket.urgency} size="sm" />
                      <DepartmentBadge department={ticket.department} />
                      <StatusBadge status={ticket.status} size="sm" />
                      <SlaBadge
                        deadline={ticket.slaDeadline}
                        status={ticket.status}
                        isBreached={ticket.isSlaBreached}
                      />
                    </div>

                    <Link to={`/tickets/${ticket.id}`} className="block">
                      <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {ticket.subject}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {ticket.description}
                      </p>
                    </Link>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Client: <strong className="text-slate-300">{ticket.client?.name}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>Assignee: <strong className="text-indigo-300">{ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned'}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>{ticket._count?.comments || 0} comments</span>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl focus:outline-none focus:border-purple-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>

                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <span>Manage</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Department Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Ticket Volume by Department
            </h3>
            <div className="space-y-3">
              {analytics.departmentDistribution.map((item) => (
                <div key={item.department}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{item.department}</span>
                    <span className="text-slate-400">{item.count} tickets</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{
                        width: `${analytics.totalTickets > 0 ? (item.count / analytics.totalTickets) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency Distribution */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Active Tickets by Urgency
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                <span className="text-xs text-rose-300 font-medium">Critical (2h SLA)</span>
                <p className="text-2xl font-bold text-rose-400 mt-1">
                  {analytics.urgencyDistribution.CRITICAL}
                </p>
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                <span className="text-xs text-amber-300 font-medium">High (6h SLA)</span>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {analytics.urgencyDistribution.HIGH}
                </p>
              </div>
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
                <span className="text-xs text-indigo-300 font-medium">Medium (24h SLA)</span>
                <p className="text-2xl font-bold text-indigo-400 mt-1">
                  {analytics.urgencyDistribution.MEDIUM}
                </p>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <span className="text-xs text-emerald-300 font-medium">Low (48h SLA)</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {analytics.urgencyDistribution.LOW}
                </p>
              </div>
            </div>
          </div>

          {/* Support Agents Workload */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 md:col-span-2">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Active Support Team & Current Workload
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {agents.map((ag) => (
                <div key={ag.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3">
                  <img src={ag.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${ag.email}`} alt={ag.name} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{ag.name}</h4>
                    <p className="text-[11px] text-slate-400">{ag.department || 'General'} Support</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                      {ag._count?.assignedTickets || 0} active tickets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
