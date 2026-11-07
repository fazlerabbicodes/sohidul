import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import { Share2, CheckCircle, RefreshCw, Sliders } from 'lucide-react';

export default function FacebookPages() {
  const [pages, setPages] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/facebook-pages');
      const data = await res.json();
      if (data.success) setPages(data.pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleToggle = async (id, field, currentVal) => {
    try {
      const res = await fetch(`/api/facebook-pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentVal })
      });
      const data = await res.json();
      if (data.success) {
        setPages(prev => prev.map(p => p.id === id ? data.page : p));
        setToast(`Updated settings for ${data.page.name}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="SETTINGS / FACEBOOK PAGES" title="Connected Facebook Pages" onRefresh={fetchPages} />

      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        <div className="space-y-4">
          {pages.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    f
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <div className="text-[11px] text-slate-500">{p.category} • {p.followers} followers</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 self-start sm:self-center">
                  Connected & Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-bold">Auto-reply comments</div>
                    <div className="text-[10px] text-slate-400">Public reply delay: {p.reply_delay_seconds}s</div>
                  </div>
                  <button
                    onClick={() => handleToggle(p.id, 'auto_reply_comments', p.auto_reply_comments)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      p.auto_reply_comments ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      p.auto_reply_comments ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-bold">Auto-send Messenger DM</div>
                    <div className="text-[10px] text-slate-400">Opens direct purchase chat</div>
                  </div>
                  <button
                    onClick={() => handleToggle(p.id, 'auto_send_dm', p.auto_send_dm)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      p.auto_send_dm ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      p.auto_send_dm ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-bold">Manual approval mode</div>
                    <div className="text-[10px] text-slate-400">Hold replies in queue</div>
                  </div>
                  <button
                    onClick={() => handleToggle(p.id, 'manual_approval', p.manual_approval)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      p.manual_approval ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      p.manual_approval ? 'translate-x-4' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
