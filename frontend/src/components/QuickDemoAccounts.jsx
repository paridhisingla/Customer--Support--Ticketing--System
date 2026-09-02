import React from 'react';
import { UserCheck, Shield, Cpu, CreditCard, KeyRound } from 'lucide-react';

const DEMO_USERS = [
  {
    roleName: 'Client (Acme Corp)',
    email: 'client@acme.com',
    password: 'password123',
    role: 'client',
    icon: UserCheck,
    color: 'from-sky-500/20 to-blue-600/20 border-sky-500/30 text-sky-300 hover:border-sky-400',
  },
  {
    roleName: 'Tech Lead (Agent)',
    email: 'alex.tech@support.io',
    password: 'password123',
    role: 'agent',
    icon: Cpu,
    color: 'from-indigo-500/20 to-purple-600/20 border-indigo-500/30 text-indigo-300 hover:border-indigo-400',
  },
  {
    roleName: 'Billing Specialist',
    email: 'sarah.billing@support.io',
    password: 'password123',
    role: 'agent',
    icon: CreditCard,
    color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-300 hover:border-emerald-400',
  },
  {
    roleName: 'Security & Access',
    email: 'david.account@support.io',
    password: 'password123',
    role: 'agent',
    icon: KeyRound,
    color: 'from-purple-500/20 to-pink-600/20 border-purple-500/30 text-purple-300 hover:border-purple-400',
  },
];

export const QuickDemoAccounts = ({ onSelectDemo }) => {
  return (
    <div className="mt-6 pt-5 border-t border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Quick Demo Logins (1-Click Fill)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DEMO_USERS.map((demo, index) => {
          const Icon = demo.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDemo(demo.email, demo.password)}
              className={`p-2.5 rounded-xl border text-left bg-gradient-to-br transition-all duration-200 ${demo.color} group hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold text-slate-200 truncate">{demo.roleName}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">{demo.email}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
