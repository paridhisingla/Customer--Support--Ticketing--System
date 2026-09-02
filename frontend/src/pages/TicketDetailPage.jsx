import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketAPI, agentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  MessageSquare,
  Lock,
  Send,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Sparkles,
  History,
  Tag,
  Monitor,
  Laptop,
  Globe,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentBadge } from '../components/DepartmentBadge';
import { SlaBadge } from '../components/SlaBadge';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // AI Copilot state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await ticketAPI.getById(id);
      if (res.data.success) {
        setTicket(res.data.ticket);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      addToast({ title: 'Error', message: 'Could not load ticket details.', type: 'error' });
      navigate(user?.role === 'agent' ? '/agent/dashboard' : '/client/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsList = async () => {
    if (user?.role === 'agent' || user?.role === 'admin') {
      try {
        const res = await agentAPI.list();
        if (res.data.success) {
          setAgents(res.data.agents);
        }
      } catch (err) {
        console.error('Failed to load agents:', err);
      }
    }
  };

  const fetchAiSuggestions = async () => {
    if (user?.role === 'agent' || user?.role === 'admin') {
      setLoadingAi(true);
      try {
        const res = await ticketAPI.getAiSuggestions(id);
        if (res.data.success) {
          setAiSuggestions(res.data.suggestions || []);
        }
      } catch (err) {
        console.warn('AI suggestions fetch failed:', err);
      } finally {
        setLoadingAi(false);
      }
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    fetchAgentsList();
    fetchAiSuggestions();
  }, [id]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await ticketAPI.addComment(id, {
        message: replyMessage.trim(),
        isInternal: isInternal && user?.role !== 'client',
      });
      if (res.data.success) {
        addToast({
          title: isInternal ? 'Internal Note Saved' : 'Reply Posted',
          message: isInternal ? 'Private note recorded for agents.' : 'Response sent to client.',
          type: 'success',
        });
        setReplyMessage('');
        setIsInternal(false);
        fetchTicketDetails();
      }
    } catch (err) {
      addToast({
        title: 'Posting Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await ticketAPI.updateStatus(id, newStatus);
      if (res.data.success) {
        addToast({
          title: 'Status Updated',
          message: `Ticket status set to ${newStatus}.`,
          type: 'success',
        });
        fetchTicketDetails();
      }
    } catch (err) {
      addToast({
        title: 'Status Update Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReassignAgent = async (agentId) => {
    try {
      const res = await ticketAPI.assign(id, agentId);
      if (res.data.success) {
        addToast({
          title: 'Ticket Reassigned',
          message: 'Support agent reassigned successfully.',
          type: 'success',
        });
        fetchTicketDetails();
      }
    } catch (err) {
      addToast({
        title: 'Assignment Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    }
  };

  const applyAiSuggestion = (suggestionText) => {
    setReplyMessage(suggestionText);
    setIsInternal(false);
    addToast({
      title: 'AI Template Applied',
      message: 'Suggestion inserted into reply box. You can customize before sending.',
      type: 'info',
    });
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400">Loading ticket #{id}...</p>
      </div>
    );
  }

  if (!ticket) return null;

  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];
  const metadata = ticket.metadata && typeof ticket.metadata === 'object' ? ticket.metadata : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={isAgent ? '/agent/dashboard' : '/client/dashboard'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isAgent ? 'Agent Queue' : 'My Tickets'}
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <UrgencyBadge urgency={ticket.urgency} />
          <StatusBadge status={ticket.status} />
          <SlaBadge deadline={ticket.slaDeadline} status={ticket.status} isBreached={ticket.isSlaBreached} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ticket Content, Messages & Replies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Ticket Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-bold">
                {ticket.ticketNumber}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Created {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
              {ticket.subject}
            </h1>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-2">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> Attached Files ({attachments.length}):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {attachments.map((att, idx) => {
                    const name = typeof att === 'object' ? (att.name || `Attachment-${idx + 1}`) : att;
                    const size = typeof att === 'object' && att.size ? ` (${Math.round(att.size / 1024)} KB)` : '';
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-indigo-300 font-mono"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="truncate max-w-xs">{name}{size}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags & Metadata Toggle */}
            <div className="mt-4 flex items-center justify-between gap-2 flex-wrap pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {ticket.tags && ticket.tags.length > 0 && ticket.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 rounded-md border border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {metadata && (
                <button
                  type="button"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <Monitor className="w-3 h-3" />
                  <span>{showMetadata ? 'Hide Client Environment' : 'View Client Environment'}</span>
                  {showMetadata ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Client Environment Info Box */}
            {metadata && showMetadata && (
              <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                <div><span className="text-[10px] text-slate-500 block">OS:</span> {metadata.os || 'Unknown'}</div>
                <div><span className="text-[10px] text-slate-500 block">Browser:</span> {metadata.browser || 'Unknown'}</div>
                <div><span className="text-[10px] text-slate-500 block">Screen:</span> {metadata.resolution || 'Standard'}</div>
                <div><span className="text-[10px] text-slate-500 block">Timezone:</span> {metadata.timezone || 'UTC'}</div>
              </div>
            )}
          </div>

          {/* AI REPLY SUGGESTIONS / COPILOT (FOR AGENTS) */}
          {isAgent && (
            <div className="glass-panel p-5 rounded-3xl border border-purple-500/30 bg-purple-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200">
                      AI Agent Copilot (Smart Reply Suggestions)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Context-aware 1-click response templates for {ticket.department} team
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiDrawer(!showAiDrawer)}
                  className="text-xs text-purple-300 hover:text-white transition"
                >
                  {showAiDrawer ? 'Hide Suggestions' : 'Show Suggestions'}
                </button>
              </div>

              {showAiDrawer && (
                <div className="space-y-2 mt-3">
                  {loadingAi ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      Generating suggestions...
                    </div>
                  ) : (
                    aiSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        onClick={() => applyAiSuggestion(sug.text)}
                        className="p-3 bg-slate-900/90 hover:bg-purple-900/30 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-purple-300 group-hover:text-purple-200">
                            {sug.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium group-hover:bg-purple-500 group-hover:text-white transition">
                            Insert 1-Click
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {sug.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conversation Thread */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Conversation Thread ({ticket.comments?.length || 0})
            </h3>

            {ticket.comments?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No responses posted yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      comm.isInternal
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : comm.user.role === 'client'
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-indigo-950/20 border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={comm.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${comm.user.email}`}
                          alt={comm.user.name}
                          className="w-6 h-6 rounded-lg bg-slate-800"
                        />
                        <span className="text-xs font-semibold text-white">{comm.user.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                            comm.user.role === 'client'
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}
                        >
                          {comm.user.role}
                        </span>
                        {comm.isInternal && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Staff Internal Note
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-8">
                      {comm.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Composer */}
            <form onSubmit={handleSendComment} className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                {isAgent ? 'Post Response or Internal Note' : 'Add Reply to Support Agent'}
              </label>
              <textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={
                  isAgent
                    ? isInternal
                      ? 'Write a private note visible only to support agents...'
                      : 'Write a helpful reply to the client...'
                    : 'Provide additional context or reply to the support team...'
                }
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              ></textarea>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {isAgent ? (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Mark as Private Internal Note (Agents only)
                    </span>
                  </label>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={submittingReply}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${
                    isInternal
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-neon'
                  }`}
                >
                  {submittingReply ? (
                    <span className="animate-pulse">Posting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {isInternal ? 'Save Internal Note' : 'Send Message'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Management Sidebar & Audit Timeline */}
        <div className="space-y-6">
          {/* Ticket Metadata Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket Controls & Info
            </h3>

            {/* Status Change */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Ticket Status</label>
              <select
                value={ticket.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                {isAgent ? (
                  <>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </>
                ) : (
                  <>
                    <option value={ticket.status}>{ticket.status}</option>
                    {ticket.status !== 'RESOLVED' && <option value="RESOLVED">Mark as Resolved</option>}
                    {ticket.status !== 'CLOSED' && <option value="CLOSED">Close Ticket</option>}
                  </>
                )}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Department</label>
              <DepartmentBadge department={ticket.department} />
            </div>

            {/* Assigned Agent */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Assigned Agent</label>
              {isAgent ? (
                <select
                  value={ticket.assignedAgentId || ''}
                  onChange={(e) => handleReassignAgent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.department || 'General'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-medium text-white">
                  {ticket.assignedAgent ? ticket.assignedAgent.name : 'Pending Queue'}
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-[11px] font-medium text-slate-400 mb-2">Raised By (Client)</label>
              <div className="flex items-center gap-2.5">
                <img
                  src={ticket.client.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${ticket.client.email}`}
                  alt={ticket.client.name}
                  className="w-8 h-8 rounded-lg bg-slate-800"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{ticket.client.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ticket.client.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log / Audit Trail */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Activity Audit Trail
            </h3>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 max-h-80 overflow-y-auto pr-1">
              {ticket.activityLogs?.map((log) => (
                <div key={log.id} className="relative pl-6 text-xs">
                  <div className={`absolute left-1 top-1 w-2 h-2 rounded-full ring-4 ring-slate-900 ${
                    log.action.includes('SLA') || log.action.includes('BREACH')
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-indigo-500'
                  }`}></div>
                  <div className="font-semibold text-slate-200">{log.action.replace('_', ' ')}</div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{log.details}</p>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
