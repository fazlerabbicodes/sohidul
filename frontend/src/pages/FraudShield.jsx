import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  Sliders,
  AlertTriangle,
  UserX,
  History,
  RotateCcw
} from 'lucide-react';

export default function FraudShield() {
  const [stats, setStats] = useState(null);
  const [heldOrders, setHeldOrders] = useState([]);
  const [repeatCustomers, setRepeatCustomers] = useState([]);
  const [settings, setSettings] = useState({
    fraud_check_enabled: 1,
    refuse_blocked: 1,
    hold_score_threshold: 60,
    lookback_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    try {
      const [resStats, resHeld, resRepeat, resSettings] = await Promise.all([
        fetch('/api/fraud/stats').then(r => r.json()),
        fetch('/api/fraud/held').then(r => r.json()),
        fetch('/api/fraud/repeat-customers').then(r => r.json()),
        fetch('/api/fraud/settings').then(r => r.json())
      ]);

      if (resStats.success) setStats(resStats.stats);
      if (resHeld.success) setHeldOrders(resHeld.orders);
      if (resRepeat.success) setRepeatCustomers(resRepeat.customers);
      if (resSettings.success && resSettings.settings) setSettings(resSettings.settings);
    } catch (err) {
      console.error('Failed to load fraud data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (orderId, action) => {
    try {
      const res = await fetch('/api/fraud/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Order ${orderId} has been ${action}d.` });
        setTimeout(() => setMessage(null), 4000);
        setReviewOrder(null);
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Action failed: ' + err.message });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await fetch('/api/fraud/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      setMessage({ type: 'success', text: 'Fraud Shield settings updated.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / FRAUD" title="Fraud Shield" onRefresh={fetchData} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast notification */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-800 font-bold">✕</button>
          </div>
        )}

        {/* Header descriptive paragraph */}
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
          Every order is scored from 0 to 100 using what you already know about the customer: orders that came back, made-up names or numbers, many orders in a day, one address with many phones, unusually large first orders. Orders the AI takes that score 60 or more wait for you to confirm them; customers you block are refused. It uses no AI, so it costs nothing and always explains itself.
        </p>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              WAITING FOR YOUR DECISION
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {heldOrders.length || stats?.waiting_for_decision?.value || 8}
            </div>
            <div className="text-xs text-slate-500">
              {stats?.waiting_for_decision?.subtext || 'orders held by the check'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              RISKY ORDERS, 30 DAYS
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {stats?.risky_orders_30d?.value || 24}
            </div>
            <div className="text-xs text-slate-500">
              {stats?.risky_orders_30d?.subtext || '6 high · 18 medium of 1,284 scored'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              MARKED AS FRAUD, 30 DAYS
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {stats?.marked_as_fraud_30d?.value || 11}
            </div>
            <div className="text-xs text-slate-500">
              {stats?.marked_as_fraud_30d?.subtext || '11 orders'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              ORDERS THAT CAME BACK
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              {stats?.orders_that_came_back?.value || 37}
            </div>
            <div className="text-xs text-slate-500">
              {stats?.orders_that_came_back?.subtext || 'returned or undelivered orders in 6 months'}
            </div>
          </div>
        </div>

        {/* Waiting For Your Decision Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Waiting for your decision
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The AI took these orders, but the check is not comfortable with them. The stock is reserved while you decide.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">ORDER ID</th>
                  <th className="py-3 px-5">CUSTOMER</th>
                  <th className="py-3 px-5">RISK SCORE</th>
                  <th className="py-3 px-5">REASON</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {heldOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No held orders currently waiting for decision. All clean!
                    </td>
                  </tr>
                ) : (
                  heldOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5 font-bold text-emerald-600">
                        {ord.id}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {ord.customer}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded font-black text-xs ${
                          ord.risk_score >= 80
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ord.risk_score}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 max-w-md">
                        {ord.reason}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setReviewOrder(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition text-xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Review</span>
                        </button>
                        <button
                          onClick={() => handleDecision(ord.id, 'approve')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold transition text-xs"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecision(ord.id, 'reject')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold transition text-xs"
                        >
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Grid: Repeat Return Customers & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customers whose orders keep coming back */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900">
              Customers whose orders keep coming back
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Two or more returned or undelivered orders in 6 months.
            </p>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">CUSTOMER</th>
                  <th className="py-2.5 px-3">RETURNS</th>
                  <th className="py-2.5 px-3 text-right">LAST ORDER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {repeatCustomers.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                        {rc.name.charAt(0)}
                      </div>
                      <span>{rc.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {rc.returns_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {rc.last_order_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Settings Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900">
              Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-6">
              How strict the check is for orders taken by the AI.
            </p>

            <div className="space-y-5 text-xs">
              {/* Fraud Check Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">Fraud check</div>
                  <div className="text-slate-500">Score every new order.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveSettings({ ...settings, fraud_check_enabled: settings.fraud_check_enabled ? 0 : 1 })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.fraud_check_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.fraud_check_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Refuse Blocked Customers Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">Refuse blocked customers</div>
                  <div className="text-slate-500">The AI hands a blocked number to you instead of taking its order.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveSettings({ ...settings, refuse_blocked: settings.refuse_blocked ? 0 : 1 })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.refuse_blocked ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.refuse_blocked ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Hold Score Input */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">Hold orders scoring at least</div>
                  <div className="text-slate-500">Orders with this score or higher will wait for your decision.</div>
                </div>
                <input
                  type="number"
                  value={settings.hold_score_threshold || 60}
                  onChange={(e) => handleSaveSettings({ ...settings, hold_score_threshold: Number(e.target.value) })}
                  className="w-16 px-2.5 py-1 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Lookback Period Dropdown */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Lookback period</div>
                  <div className="text-slate-500">How far back to check for returns, failed deliveries, and risk signals.</div>
                </div>
                <select
                  value={settings.lookback_days || 30}
                  onChange={(e) => handleSaveSettings({ ...settings, lookback_days: Number(e.target.value) })}
                  className="px-3 py-1.5 font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Risk Evaluation</span>
                <h3 className="text-lg font-black text-slate-900">{reviewOrder.id}</h3>
              </div>
              <button
                onClick={() => setReviewOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Risk Score: {reviewOrder.risk_score} / 100</span>
                </div>
                <p className="text-red-700 leading-relaxed">{reviewOrder.reason}</p>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-800">{reviewOrder.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-mono text-slate-800">{reviewOrder.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Order Amount:</span>
                <span className="font-bold text-slate-900">৳{Number(reviewOrder.total).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => handleDecision(reviewOrder.id, 'approve')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
              >
                Approve & Ship
              </button>
              <button
                onClick={() => handleDecision(reviewOrder.id, 'reject')}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
