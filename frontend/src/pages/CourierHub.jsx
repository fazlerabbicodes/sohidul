import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import { Truck, CheckCircle, ExternalLink, Zap, ShieldCheck } from 'lucide-react';

export default function CourierHub() {
  const [couriers, setCouriers] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchCouriers = async () => {
    try {
      const res = await fetch('/api/couriers');
      const data = await res.json();
      if (data.success) setCouriers(data.couriers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleTestPing = async (id) => {
    try {
      const res = await fetch(`/api/couriers/test/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToast(`Ping verified: ${data.ping_ms}ms latency to ${id} API.`);
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="AI & OPERATIONS / COURIER HUB" title="Courier Logistics Hub" onRefresh={fetchCouriers} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {couriers.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <div className="text-[11px] text-slate-500">{c.type}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Coverage</span>
                  <span className="font-semibold text-slate-800">{c.coverage}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Success Rate</span>
                  <span className="font-bold text-emerald-600">{c.success_rate}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <span className="text-slate-500 font-mono text-[10px] truncate max-w-xs">{c.api_endpoint}</span>
                <button
                  onClick={() => handleTestPing(c.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition"
                >
                  Test Ping
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
