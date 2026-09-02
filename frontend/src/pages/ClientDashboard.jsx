import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentBadge } from '../components/DepartmentBadge';
import { SlaBadge } from '../components/SlaBadge';
import { TriagePreview } from '../components/TriagePreview';
import { ChatbotWidget } from '../components/ChatbotWidget';

export const ClientDashboard = () => {
  const { user } = useAuth();
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
  const [attachmentInput, setAttachmentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Acknowledgement State
  const [acknowledgement, setAcknowledgement] = useState(null);

  const fetchTickets = async () => {
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
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

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
    }, 400);

    return () => clearTimeout(timer);
  }, [subject, description]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const attachments = attachmentInput ? [attachmentInput.trim()] : [];
      const res = await ticketAPI.create({
        subject,
        description,
        departmentOverride: departmentOverride || undefined,
        urgencyOverride: urgencyOverride || undefined,
        attachments,
      });

      if (res.data.success) {
        setAcknowledgement(res.data.acknowledgement);
        setIsModalOpen(false);
        setSubject('');
        setDescription('');
        setAttachmentInput('');
        setTriageData(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      alert('Failed to submit ticket: ' + (err.response?.data?.message || err.message));
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
              className="block glass-card p-4 sm:p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md">
                    {ticket.ticketNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {ticket.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <DepartmentBadge department={ticket.department} />
                      <span className="text-slate-600">•</span>
                      <span>Assigned to: <strong className="text-slate-300">{ticket.assignedAgent ? ticket.assignedAgent.name : 'Queue'}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <UrgencyBadge urgency={ticket.urgency} size="sm" />
                  <StatusBadge status={ticket.status} size="sm" />
                  <SlaBadge deadline={ticket.slaDeadline} status={ticket.status} isBreached={ticket.isSlaBreached} />
                  <div className="p-1 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 animate-slide-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Raise a Support Ticket</h2>
                <p className="text-xs text-slate-400">
                  Our automated NLP system will classify urgency, route to the best engineer, and set SLA deadlines.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Production API webhook failing with 500 error"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the steps to reproduce, error codes, impact, or affected accounts..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Optional Overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Department (Optional Override)
                  </label>
                  <select
                    value={departmentOverride}
                    onChange={(e) => setDepartmentOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Auto-Detect via Triage (Recommended)</option>
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Account">Account Security</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Urgency (Optional Override)
                  </label>
                  <select
                    value={urgencyOverride}
                    onChange={(e) => setUrgencyOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Auto-Detect via Triage (Recommended)</option>
                    <option value="CRITICAL">Critical (2h SLA)</option>
                    <option value="HIGH">High (6h SLA)</option>
                    <option value="MEDIUM">Medium (24h SLA)</option>
                    <option value="LOW">Low (48h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Attachment Link / File URL (Optional)
                </label>
                <div className="relative">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={attachmentInput}
                    onChange={(e) => setAttachmentInput(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Real-time Triage Preview */}
              <TriagePreview triageData={triageData} loading={triageLoading} />

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-neon transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="animate-pulse">Triaging & Submitting...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Submit Support Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Intake Acknowledgement Modal */}
      {acknowledgement && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center animate-slide-up relative">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white">Ticket Submitted & Acknowledged!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Your ticket has been recorded, classified, and assigned.
            </p>

            {/* Details Box */}
            <div className="my-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Ticket ID:</span>
                <span className="font-mono font-bold text-indigo-400">{acknowledgement.ticketNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Classified Urgency:</span>
                <UrgencyBadge urgency={acknowledgement.urgency} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Routed Department:</span>
                <DepartmentBadge department={acknowledgement.department} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Assigned Engineer:</span>
                <span className="font-medium text-white">{acknowledgement.assignedAgent}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">SLA Resolution Target:</span>
                <span className="text-amber-300 font-semibold">{acknowledgement.slaHours} hours</span>
              </div>
            </div>

            <button
              onClick={() => setAcknowledgement(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Floating Chatbot Assistant */}
      <ChatbotWidget onOpenTicketForm={handleOpenTicketFromBot} />
    </div>
  );
};
