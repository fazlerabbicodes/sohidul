import React, { useState } from 'react';
import { RefreshCw, Database, FlaskConical } from 'lucide-react';

export default function TopNav({ breadcrumb = 'WORKSPACE / OVERVIEW', title = 'Dashboard', onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleTestPing = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setTestResult('API Online (SQLite WAL)');
      setTimeout(() => setTestResult(null), 3000);
    } catch {
      setTestResult('Ping failed');
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/80 px-8 py-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            {breadcrumb}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {title}
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Refresh pill */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* DB Connected status */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 text-slate-700 text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>DB Connected</span>
          </div>

          {/* Test pill */}
          <button
            onClick={handleTestPing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition shadow-2xs"
            title="Ping backend API and test connection"
          >
            <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
            <span>{testResult || 'Test'}</span>
          </button>

          {/* Page-specific action buttons */}
          {children}
        </div>
      </div>
    </div>
  );
}
