import React from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  ShieldCheck,
  Zap,
  Bot,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  Headphones,
  BarChart3,
  Flame,
} from 'lucide-react';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { SlaBadge } from '../components/SlaBadge';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[140px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Intelligent Customer Support Desk</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span className="text-slate-400">Production Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Smart Ticketing,{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Automated Triage
          </span>{' '}
          & Real-Time SLA Routing
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A dual-role platform where clients raise and track support requests while support agents triage, manage SLAs, and resolve tickets with precision.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login?role=client"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-neon hover:scale-105 transition-all duration-200"
          >
            <LifeBuoy className="w-5 h-5" />
            Client Support Portal
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/login?role=agent"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700/80 hover:border-indigo-500/40 transition-all duration-200"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Agent Command Center
          </Link>
        </div>

        {/* Interactive Live Preview Mockup */}
        <div className="mt-16 max-w-5xl mx-auto relative rounded-2xl p-1 bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-transparent shadow-glass">
          <div className="bg-slate-950/90 rounded-xl p-6 border border-slate-800 backdrop-blur-xl">
            {/* Header row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="ml-2 text-xs font-mono text-slate-500">deskflow.cloud/queue/live-monitor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">Real-time Triage Active</span>
              </div>
            </div>

            {/* Live Sample Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
              {/* Card 1 */}
              <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-slate-900/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-indigo-400 font-semibold">TICK-1001</span>
                  <UrgencyBadge urgency="CRITICAL" size="sm" />
                </div>
                <h4 className="text-sm font-semibold text-white truncate">Production API 500 Outage</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Checkout endpoint failing under high webhook volume. Auto-triaged to Tech Support.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Agent: Alex Rivera</span>
                  <span className="text-xs font-medium text-amber-400">1h 24m SLA left</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-slate-900/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-indigo-400 font-semibold">TICK-1002</span>
                  <UrgencyBadge urgency="HIGH" size="sm" />
                </div>
                <h4 className="text-sm font-semibold text-white truncate">Duplicate Charge on Renewal</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Billed twice on invoice #INV-9821. Auto-routed to Billing Specialist.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Agent: Sarah Chen</span>
                  <span className="text-xs font-medium text-indigo-300">4h 15m SLA left</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card p-4 rounded-xl border border-indigo-500/20 bg-slate-900/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-indigo-400 font-semibold">TICK-1003</span>
                  <UrgencyBadge urgency="MEDIUM" size="sm" />
                </div>
                <h4 className="text-sm font-semibold text-white truncate">SAML SSO Setup Assistance</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Configuring Okta SAML assertion metadata for 50 team members.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Agent: David Miller</span>
                  <span className="text-xs font-medium text-slate-400">20h SLA left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
            Engineered For Excellence
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything needed for production support operations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Automated Triage & Routing</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instantly assesses ticket keywords to classify priority (Critical, High, Medium, Low), assign relevant tags, and route to the best available department agent.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Live SLA Timers & Escalations</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dynamically computes resolution targets (2h, 6h, 24h, 48h). Visual countdowns warn agents before SLA breach occurs.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-sky-500/40">
            <div className="w-12 h-12 rounded-xl bg-sky-600/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Role-Based Access Control</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Secure client vs agent authorization. Clients track their submitted issues while agents access full queues, internal notes, and re-assignment.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Operational Analytics</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track SLA compliance rates, department resolution velocity, active queue backlogs, and agent load distribution.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-pink-500/40">
            <div className="w-12 h-12 rounded-xl bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">DeskBot AI Assistant</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Customer-facing intelligent assistant resolves common questions and converts complex issues directly into pre-triaged support tickets.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Full Audit & Internal Notes</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every status change, re-assignment, and customer reply is chronologically recorded with private internal notes reserved for support staff.
            </p>
          </div>
        </div>
      </section>

      {/* Role Comparison CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Client Card */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/30 shadow-glass">
            <span className="px-3 py-1 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
              For Customers & Clients
            </span>
            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Client Support Portal</h3>
            <p className="text-slate-400 text-sm mb-6">
              Raise tickets with real-time auto-triage preview, receive instant confirmation, and track resolution timelines with full transparency.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant ticket intake with acknowledgement
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live conversation thread with assigned engineer
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Status tracker & resolution confirmation
              </li>
            </ul>
            <Link
              to="/login?role=client"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
            >
              Access Client Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Agent Card */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 border border-purple-500/30 shadow-glass">
            <span className="px-3 py-1 text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
              For Support Engineers
            </span>
            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Agent Command Center</h3>
            <p className="text-slate-400 text-sm mb-6">
              Manage incoming queues, prioritize critical outages, add internal team notes, monitor SLAs, and resolve customer issues.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> Filterable queue by urgency, dept & SLA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> Internal staff notes & auto-assignment
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> Performance analytics & resolution metrics
              </li>
            </ul>
            <Link
              to="/login?role=agent"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
            >
              Access Agent Desk
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 DeskFlow Customer Support Platform • Production Ready Technical Assessment</p>
      </footer>
    </div>
  );
};
