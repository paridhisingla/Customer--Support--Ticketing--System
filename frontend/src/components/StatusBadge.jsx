import React from 'react';

const statusConfig = {
  OPEN: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    label: 'Open',
  },
  IN_PROGRESS: {
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    label: 'In Progress',
  },
  RESOLVED: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    label: 'Resolved',
  },
  CLOSED: {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    label: 'Closed',
  },
};

export const StatusBadge = ({ status = 'OPEN', size = 'md' }) => {
  const config = statusConfig[status?.toUpperCase()] || statusConfig.OPEN;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses}`}>
      {config.label}
    </span>
  );
};
