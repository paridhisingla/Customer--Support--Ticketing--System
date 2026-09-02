import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SlaBadge = ({ deadline, status, isBreached }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [hasBreached, setHasBreached] = useState(isBreached);

  useEffect(() => {
    if (!deadline || ['RESOLVED', 'CLOSED'].includes(status)) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setHasBreached(true);
        const overdueMinutes = Math.floor(Math.abs(diff) / (1000 * 60));
        const overdueHours = Math.floor(overdueMinutes / 60);
        const remMinutes = overdueMinutes % 60;
        setTimeLeft(`Breached by ${overdueHours}h ${remMinutes}m`);
        setIsUrgent(true);
      } else {
        setHasBreached(false);
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours < 1) {
          setIsUrgent(true);
          setTimeLeft(`${minutes}m left`);
        } else {
          setIsUrgent(hours < 4);
          setTimeLeft(`${hours}h ${minutes}m left`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [deadline, status, isBreached]);

  if (['RESOLVED', 'CLOSED'].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        SLA Met
      </span>
    );
  }

  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <Clock className="w-3.5 h-3.5" />
        No SLA
      </span>
    );
  }

  if (hasBreached) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        {timeLeft || 'SLA Breached'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isUrgent
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      {timeLeft || 'Calculating...'}
    </span>
  );
};
