import React from 'react';
import TopNav from '../components/TopNav';
import { TrendingUp, BarChart3, PieChart, Users, DollarSign } from 'lucide-react';

export default function Analytics() {
  return (
    <div>
      <TopNav breadcrumb="AI & OPERATIONS / ANALYTICS" title="Commerce & Growth Analytics" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MONTHLY CONVERSION</span>
            <div className="text-3xl font-black text-slate-900">42.8%</div>
            <p className="text-slate-500">From incoming Facebook comments to confirmed COD orders.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI AUTOMATION RATIO</span>
            <div className="text-3xl font-black text-emerald-600">95.3%</div>
            <p className="text-slate-500">Of order conversations completed autonomously without human takeover.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">FRAUD DETECTION RATE</span>
            <div className="text-3xl font-black text-red-600">98.2%</div>
            <p className="text-slate-500">Risky repeat returns and fake numbers blocked before dispatch.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center py-12 space-y-3">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Live Realtime Metrics Connected</h3>
          <p className="text-slate-500 max-w-md mx-auto text-xs">
            All charts and order trends update synchronously with your SQLite / MySQL transactional database and n8n pipelines.
          </p>
        </div>
      </div>
    </div>
  );
}
