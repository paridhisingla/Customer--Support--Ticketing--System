import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  PlusCircle,
  Search,
  Filter,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Paperclip,
  Check,
  X,
  Bot,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentBadge } from '../components/DepartmentBadge';
import { SlaBadge } from '../components/SlaBadge';
import { TriagePreview } from '../components/TriagePreview';
import { ChatbotWidget } from '../components/ChatbotWidget';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [departmentOverride, setDepartmentOverride] = useState('');
  const [urgencyOverride, setUrgencyOverride] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Acknowledgement State
  const [acknowledgement, setAcknowledgement] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketAPI.list({
        status: statusFilter,
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
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Live SSE listener for real-time ticket status updates
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = ticketAPI.createEventSource();
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'STATUS_UPDATED' || payload.event === 'NEW_COMMENT') {
            fetchTickets();
          }
        } catch (e) {}
      };
    } catch (err) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchTickets]);

  // Debounced auto-triage preview
  useEffect(() => {
    if (!subject && !description) {
      setTriageData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setTriageLoading(true);
      try {
        const res = await ticketAPI.previewTriage({ subject, description });
        if (res.data.success) {
          setTriageData(res.data.data);
        }
      } catch (err) {
        console.error('Triage preview error:', err);
      } finally {
        setTriageLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [subject, description]);

  // Helper to detect client environment metadata
  const getClientMetadata = () => {
    const ua = navigator.userAgent;
    let browser = 'Chrome/Modern Browser';
    let os = 'Windows';

    if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Windows')) os = 'Windows 11/10';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Chrome')) browser = 'Google Chrome';

    return {
      os,
      browser,
      resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date().toISOString(),
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const metadata = getClientMetadata();
      const res = await ticketAPI.create({
        subject,
        description,
        departmentOverride: departmentOverride || undefined,
        urgencyOverride: urgencyOverride || undefined,
        metadata,
        attachments,
      });

      if (res.data.success) {
        setAcknowledgement(res.data.acknowledgement);
        addToast({
          title: 'Ticket Submitted',
          message: `Your ticket ${res.data.acknowledgement.ticketNumber} has been acknowledged & routed.`,
          type: 'success',
        });
        setIsModalOpen(false);
        setSubject('');
        setDescription('');
        setAttachments([]);
        setDepartmentOverride('');
        setUrgencyOverride('');
        setTriageData(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      addToast({
        title: 'Submission Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTicketFromBot = (prefillSubject, prefillDescription) => {
    setSubject(prefillSubject);
    setDescription(prefillDescription);
    setIsModalOpen(true);
  };

  // Stats
  const activeTickets = tickets.filter((t) => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length;
  const resolvedTickets = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track existing requests or raise a new issue for immediate support resolution.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-neon transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          Raise New Ticket
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Submitted</span>
            <LifeBuoy className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{tickets.length}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active / In Progress</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{activeTickets}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Resolved Issues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{resolvedTickets}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'All Tickets' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTickets();
          }}
          className="relative w-full sm:w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400">Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-2xl border border-slate-800 p-8">
          <LifeBuoy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No support tickets found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter !== 'ALL'
              ? `No tickets currently match the '${statusFilter}' status filter.`
              : 'You have not submitted any support tickets yet. Click below to raise one!'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            <PlusCircle className="w-4 h-4" />
            Raise First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="block glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
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

                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {ticket.subject}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-slate-500">
                      Assigned to: <strong className="text-slate-300">{ticket.assignedAgent ? ticket.assignedAgent.name : 'In Queue'}</strong>
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* TICKET SUBMISSION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-700/80 my-8 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md">
                Smart Intake Desk
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                Raise Support Ticket
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Our automated triage engine will determine urgency, assign SLA, and route your ticket.
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production 500 API errors during checkout"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the issue, steps to reproduce, or transaction details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                ></textarea>
              </div>

              {/* Attachments Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Attachments / Screenshots
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition group">
                  <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mb-1" />
                  <span className="text-xs text-slate-300">Click to upload logs or screenshots</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, PDF, TXT, LOG up to 10MB</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {attachments.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {attachments.map((att, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                      >
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span className="truncate max-w-[120px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-time Triage Live Preview */}
              <TriagePreview
                triageData={triageData}
                loading={triageLoading}
                hasInput={Boolean(subject || description)}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !description.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-neon transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting & Routing...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACKNOWLEDGEMENT MODAL */}
      {acknowledgement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-emerald-500/40 text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white">Ticket Acknowledged!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your issue has been logged, triaged, and assigned to our resolution queue.
            </p>

            <div className="my-6 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ticket Number:</span>
                <span className="font-mono font-bold text-indigo-400">{acknowledgement.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Department:</span>
                <span className="text-white font-medium">{acknowledgement.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calculated Urgency:</span>
                <span className="text-white font-medium">{acknowledgement.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Agent:</span>
                <span className="text-indigo-300 font-medium">{acknowledgement.assignedAgent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target SLA Response:</span>
                <span className="text-emerald-400 font-bold">{acknowledgement.slaHours} hours</span>
              </div>
            </div>

            <button
              onClick={() => setAcknowledgement(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-neon"
            >
              Done & View Ticket
            </button>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Widget */}
      <ChatbotWidget onOpenTicketForm={handleOpenTicketFromBot} />
    </div>
  );
};

export default ClientDashboard;
