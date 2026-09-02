import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Bell } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgStyle = 'bg-slate-900/90 border-slate-700/70 text-slate-200';
          let Icon = Info;
          let iconColor = 'text-indigo-400';

          if (toast.type === 'success') {
            bgStyle = 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error' || toast.type === 'breach') {
            bgStyle = 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50';
            Icon = AlertTriangle;
            iconColor = 'text-rose-400 animate-pulse';
          } else if (toast.type === 'live') {
            bgStyle = 'bg-cyan-950/90 border-cyan-500/40 text-cyan-100 shadow-cyan-950/50';
            Icon = Bell;
            iconColor = 'text-cyan-400 animate-bounce';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-xl transition-all duration-300 transform translate-y-0 ${bgStyle}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {toast.title && <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">{toast.title}</h4>}
                <p className="text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (toast) => console.log('Toast:', toast),
      removeToast: () => {},
    };
  }
  return context;
};
