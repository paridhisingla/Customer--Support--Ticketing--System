import React from 'react';
import { Cpu, CreditCard, ShieldCheck, HelpCircle } from 'lucide-react';

const deptIcons = {
  Technical: Cpu,
  Billing: CreditCard,
  Account: ShieldCheck,
  General: HelpCircle,
};

export const DepartmentBadge = ({ department = 'General' }) => {
  const Icon = deptIcons[department] || HelpCircle;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-lg">
      <Icon className="w-3.5 h-3.5 text-indigo-400" />
      {department}
    </span>
  );
};
