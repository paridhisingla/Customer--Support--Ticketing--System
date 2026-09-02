import React from 'react';

const urgencyConfig = {
  CRITICAL: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-500 animate-ping',
    label: 'Critical',
  },
  HIGH: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'High',
  },
  MEDIUM: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
    label: 'Medium',
  },
  LOW: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Low',
  },
};

export const UrgencyBadge = ({ urgency = 'MEDIUM', size = 'md' }) => {
  const config = urgencyConfig[urgency?.toUpperCase()] || urgencyConfig.MEDIUM;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        {urgency?.toUpperCase() === 'CRITICAL' && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot.split(' ')[0]}`}></span>
      </span>
      {config.label}
    </span>
  );
};
