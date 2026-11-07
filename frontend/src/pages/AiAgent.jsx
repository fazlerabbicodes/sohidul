import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import { Bot, Sparkles, Check, Sliders, Globe, Clock, ShieldCheck } from 'lucide-react';

export default function AiAgent() {
  const [config, setConfig] = useState({
    name: 'CommercePilot Autonomous Sales Assistant',
    persona: 'Friendly Bangladeshi eCommerce Sales Rep',
    language: 'Bilingual (Bangla / Banglish / English)',
    sales_tone: 'Polite, persuasive, concise',
    autonomous_order_taking: true,
    auto_calculate_inside_dhaka_delivery: 80,
    auto_calculate_outside_dhaka_delivery: 130,
    max_discount_percentage: 10,
    require_human_confirmation_over_bdt: 15000,
    operating_hours: '24/7 Continuous Autopilot'
  });
  const [toast, setToast] = useState(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/ai-agent/config');
      const data = await res.json();
      if (data.success) setConfig(data.config);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ai-agent/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setToast('AI Sales Agent configuration saved successfully!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="AI & OPERATIONS / AI AGENT" title="Autonomous AI Sales Agent" onRefresh={fetchConfig} />

      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5 text-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Agent Persona & Behavior</h2>
              <p className="text-slate-500 text-xs">Controls how the AI interacts with commenters and Messenger buyers.</p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Agent Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Language Mode</label>
              <select
                value={config.language}
                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="Bilingual (Bangla / Banglish / English)">Bilingual (Bangla / Banglish / English)</option>
                <option value="English Only">English Only</option>
                <option value="Bangla Script Only">Bangla Script Only</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Tone</label>
              <input
                type="text"
                value={config.sales_tone}
                onChange={(e) => setConfig({ ...config, sales_tone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inside Dhaka Delivery Fee (৳)</label>
              <input
                type="number"
                value={config.auto_calculate_inside_dhaka_delivery}
                onChange={(e) => setConfig({ ...config, auto_calculate_inside_dhaka_delivery: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Outside Dhaka Delivery Fee (৳)</label>
              <input
                type="number"
                value={config.auto_calculate_outside_dhaka_delivery}
                onChange={(e) => setConfig({ ...config, auto_calculate_outside_dhaka_delivery: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-lime text-slate-950 font-bold hover:bg-[#95db28] transition shadow-2xs"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
