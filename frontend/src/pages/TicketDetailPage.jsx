import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketAPI, agentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  Share2,
} from 'lucide-react';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DepartmentBadge } from '../components/DepartmentBadge';
import { SlaBadge } from '../components/SlaBadge';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await ticketAPI.getById(id);
      if (res.data.success) {
        setTicket(res.data.ticket);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      alert('Could not load ticket details.');
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

  useEffect(() => {
    fetchTicketDetails();
    fetchAgentsList();
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
        setReplyMessage('');
        setIsInternal(false);
        fetchTicketDetails();
      }
    } catch (err) {
      alert('Failed to send comment: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await ticketAPI.updateStatus(id, newStatus);
      if (res.data.success) {
        fetchTicketDetails();
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReassignAgent = async (agentId) => {
    try {
      const res = await ticketAPI.assign(id, agentId);
      if (res.data.success) {
        fetchTicketDetails();
      }
    } catch (err) {
      alert('Failed to assign agent: ' + (err.response?.data?.message || err.message));
    }
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
  const attachments = ticket.attachments ? JSON.parse(ticket.attachments) : [];

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

        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-2">
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
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments:
                </span>
                {attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono truncate max-w-xs"
                  >
                    {att}
                  </a>
                ))}
              </div>
            )}

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                {ticket.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 rounded-md border border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

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

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {ticket.activityLogs?.map((log) => (
                <div key={log.id} className="relative pl-6 text-xs">
                  <div className="absolute left-1 top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
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
