import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import {
  Zap,
  Copy,
  Check,
  Send,
  Plus,
  Trash2,
  Download,
  Terminal,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function N8nAutomation() {
  const [webhooks, setWebhooks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // New webhook registration form
  const [newWh, setNewWh] = useState({
    name: '',
    event: 'order.created',
    target_url: 'http://localhost:5678/webhook/order-created',
    secret: 'n8n_secret_' + Math.random().toString(36).substring(7)
  });

  // Test dispatcher state
  const [testUrl, setTestUrl] = useState('http://localhost:5678/webhook/order-created');
  const [testEvent, setTestEvent] = useState('order.created');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchData = async () => {
    try {
      const [resWh, resWf, resLogs] = await Promise.all([
        fetch('/api/n8n/webhooks').then(r => r.json()),
        fetch('/api/n8n/workflows').then(r => r.json()),
        fetch('/api/n8n/logs').then(r => r.json())
      ]);

      if (resWh.success) setWebhooks(resWh.webhooks);
      if (resWf.success) setWorkflows(resWf.workflows);
      if (resLogs.success) setLogs(resLogs.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterWebhook = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/n8n/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWh)
      });
      const data = await res.json();
      if (data.success) {
        setToast('Webhook registered successfully!');
        setTimeout(() => setToast(null), 3000);
        setNewWh({
          name: '',
          event: 'order.created',
          target_url: 'http://localhost:5678/webhook/order-created',
          secret: 'n8n_secret_' + Math.random().toString(36).substring(7)
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      await fetch(`/api/n8n/webhooks/${id}`, { method: 'DELETE' });
      setWebhooks(prev => prev.filter(w => w.id !== id));
      setToast('Webhook deleted');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestWebhook = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/n8n/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: testUrl, event: testEvent })
      });
      const data = await res.json();
      setTestResult(data);
      fetchData();
    } catch (err) {
      setTestResult({ success: false, message: err.message, status_code: 500 });
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div>
      <TopNav breadcrumb="SETTINGS / AUTOMATION" title="n8n Automation & Webhook Hub" onRefresh={fetchData} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-brand-lime text-slate-950 font-black text-xs uppercase tracking-wider">
                n8n Ready
              </span>
              <span className="text-xs text-slate-400">Low-code workflow automation engine</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Automate CommercePilot with n8n
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect CommercePilot AI to your n8n instance to automate order fulfillment, courier consignment generation, Google Sheets synchronization, WhatsApp/Telegram fraud alerts, and outbound B2B lead enrichment.
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1.5 min-w-[240px]">
            <div className="text-[11px] font-bold text-brand-lime uppercase tracking-wider">
              Backend Webhook Server
            </div>
            <div className="font-mono text-white text-xs">
              http://localhost:5000/api/webhooks
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Event Dispatcher Active</span>
            </div>
          </div>
        </div>

        {/* 2-Column: Left Outbound Webhook Manager, Right Test Trigger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Register n8n Webhook */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Outbound Webhooks to n8n
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Events will automatically fire POST requests to these n8n Webhook URLs.
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterWebhook} className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800">Add New n8n Webhook Trigger</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Workflow Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Courier Auto Booking"
                    value={newWh.name}
                    onChange={(e) => setNewWh({ ...newWh, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trigger Event</label>
                  <select
                    value={newWh.event}
                    onChange={(e) => setNewWh({ ...newWh, event: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-medium"
                  >
                    <option value="*">All Events (*)</option>
                    <option value="order.created">order.created</option>
                    <option value="order.status_updated">order.status_updated</option>
                    <option value="fraud.flagged">fraud.flagged</option>
                    <option value="comment.received">comment.received</option>
                    <option value="lead.discovered">lead.discovered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">n8n Webhook URL</label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:5678/webhook/..."
                  value={newWh.target_url}
                  onChange={(e) => setNewWh({ ...newWh, target_url: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                + Register n8n Webhook
              </button>
            </form>

            {/* Registered list */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition"
                >
                  <div className="overflow-hidden">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{wh.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700">
                        {wh.event}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm mt-0.5">
                      {wh.target_url}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Interactive Test Dispatcher */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Interactive n8n Test Dispatcher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Send a sample event payload to test if your n8n workflow triggers and processes properly.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Webhook URL</label>
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Event Payload Type</label>
                <select
                  value={testEvent}
                  onChange={(e) => setTestEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  <option value="order.created">order.created (Simulated Order Payload)</option>
                  <option value="fraud.flagged">fraud.flagged (High Risk Flag Payload)</option>
                  <option value="comment.received">comment.received (Facebook Auto-Reply Payload)</option>
                  <option value="lead.discovered">lead.discovered (B2B Lead Scraped Payload)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSendTestWebhook}
                disabled={testLoading}
                className="w-full py-2.5 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-black text-xs transition shadow-2xs flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testLoading ? 'Sending...' : 'Send Test Webhook to n8n'}</span>
              </button>

              {testResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    <span>Status Code: {testResult.status_code || 0}</span>
                  </div>
                  <p className="text-[11px]">{testResult.message}</p>
                  {testResult.response_body && (
                    <pre className="font-mono text-[10px] bg-white/70 p-2 rounded mt-1 overflow-x-auto">
                      {testResult.response_body}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ready-to-use n8n Workflow JSON Templates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ready-to-Import n8n Workflow Templates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Copy JSON or download directly into your n8n dashboard (File → Import from Clipboard/File).
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              3 Pre-built Workflows
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {workflows.map((wf) => {
              const jsonStr = JSON.stringify(wf.template, null, 2);
              const isCopied = copiedId === wf.id;

              return (
                <div key={wf.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-slate-900 mb-1">{wf.name}</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed mb-2">
                      {wf.description}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                      Trigger: {wf.event}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => copyToClipboard(jsonStr, wf.id)}
                      className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${wf.id}.json`;
                        a.click();
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                      title="Download JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Webhook Activity Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live Webhook Logs & Diagnostics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time activity logs for both inbound calls from n8n and outbound event dispatches.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">EVENT</th>
                  <th className="py-2.5 px-4">DIRECTION</th>
                  <th className="py-2.5 px-4">ENDPOINT / URL</th>
                  <th className="py-2.5 px-4">STATUS</th>
                  <th className="py-2.5 px-4">PAYLOAD SNIPPET</th>
                  <th className="py-2.5 px-4 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No logs recorded yet. Send a test webhook above!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {log.event}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.direction === 'inbound' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {log.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate" title={log.endpoint}>
                        {log.endpoint}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.status_code >= 200 && log.status_code < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status_code || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                        {log.payload_json}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                        {log.created_at?.replace('T', ' ').slice(0, 19)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
