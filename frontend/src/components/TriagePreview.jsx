import React from 'react';
import { Sparkles, Zap, Shield, Tag, Clock } from 'lucide-react';
import { UrgencyBadge } from './UrgencyBadge';
import { DepartmentBadge } from './DepartmentBadge';

export const TriagePreview = ({ triageData, loading }) => {
  if (!triageData && !loading) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 border border-indigo-500/20 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/15">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-indigo-200 uppercase">
            Live AI Triage & Routing Preview
          </span>
        </div>
        {loading && (
          <span className="text-xs text-indigo-300/70 animate-pulse">Analyzing text...</span>
        )}
      </div>

      {triageData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Detected Urgency</span>
            <div className="flex items-center gap-2">
              <UrgencyBadge urgency={triageData.urgency} size="sm" />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" /> {triageData.slaHours}h SLA
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Target Department</span>
            <DepartmentBadge department={triageData.department} />
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Extracted Tags</span>
            <div className="flex flex-wrap gap-1">
              {triageData.tags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
