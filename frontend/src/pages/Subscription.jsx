import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import {
  CreditCard,
  CheckCircle,
  Clock,
  Info,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Subscription() {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  // Renewal form
  const [selectedPlan, setSelectedPlan] = useState('Pro Monthly — ৳2,999 · 1 month · 5 Pages');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [transReference, setTransReference] = useState('8K7H2D4F9M');
  const [promoCode, setPromoCode] = useState('PRO10');
  const [note, setNote] = useState('Renew for next month');

  const fetchData = async () => {
    try {
      const [resSub, resPay, resNotif] = await Promise.all([
        fetch('/api/subscription').then(r => r.json()),
        fetch('/api/subscription/payments').then(r => r.json()),
        fetch('/api/subscription/notifications').then(r => r.json())
      ]);

      if (resSub.success) setSubscription(resSub.subscription);
      if (resPay.success) setPayments(resPay.payments);
      if (resNotif.success) setNotifications(resNotif.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/subscription/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          method: paymentMethod,
          reference: transReference,
          promo_code: promoCode,
          note
        })
      });
      const data = await res.json();
      if (data.success) {
        setToast(data.message);
        setTimeout(() => setToast(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="SETTINGS / SUBSCRIPTION" title="Your subscription" onRefresh={fetchData} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* Top 2 Cards: Left Plan Details, Right Renew Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Card: Pro Plan Active */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {subscription?.plan_name || 'Pro Plan'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Plan and validity
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Started:</span>
                <span className="font-bold text-slate-900">{subscription?.started_date || '01 Oct 2026'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Expires:</span>
                <span className="font-bold text-slate-900">{subscription?.expires_date || '01 Feb 2027'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Remaining:</span>
                <span className="font-black text-slate-900">{subscription?.remaining_days || 68} days</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-lime rounded-full" style={{ width: '65%' }} />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-slate-500">Facebook Pages:</span>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <span>{subscription?.connected_pages || 3} / {subscription?.max_pages || 5} Pages connected</span>
                  <a href="/facebook-pages" className="text-blue-600 hover:underline font-bold text-[11px]">Manage Pages</a>
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">AI replies:</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>running ({subscription?.ai_replies_count?.toLocaleString() || '12,430'} replies this month)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span>Your Page limit is used up to 3 of 5. Ask for a higher limit or upgrade.</span>
              <button
                onClick={() => {
                  setToast('Facebook token refresh initiated.');
                  setTimeout(() => setToast(null), 3000);
                }}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
              >
                Reconnect Facebook
              </button>
            </div>
          </div>

          {/* Right Card: Renew or Upgrade */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Renew or upgrade
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pay with bKash, Nagad, Rocket or bank transfer, then enter the reference. We confirm it and extend your subscription.
              </p>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  <option>Pro Monthly — ৳2,999 · 1 month · 5 Pages</option>
                  <option>Pro Quarterly — ৳7,999 · 3 months · 5 Pages</option>
                  <option>Enterprise Annual — ৳24,999 · 1 year · Unlimited</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">I paid with</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction reference</label>
                  <input
                    type="text"
                    required
                    value={transReference}
                    onChange={(e) => setTransReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Promo code (optional)</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                List price ৳2,999. Your discount or promo code is applied when you send the request.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-extrabold text-xs transition shadow-2xs"
              >
                Send payment for verification
              </button>
            </form>
          </div>
        </div>

        {/* Payment History Table matching Screenshot 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Payment history</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">DATE</th>
                  <th className="py-3 px-5">PLAN</th>
                  <th className="py-3 px-5">AMOUNT</th>
                  <th className="py-3 px-5">METHOD</th>
                  <th className="py-3 px-5">REFERENCE</th>
                  <th className="py-3 px-5">STATUS</th>
                  <th className="py-3 px-5 text-right">INVOICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5 font-medium text-slate-800">
                      {p.date}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {p.plan}
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">
                      ৳{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="font-semibold text-slate-700">{p.method}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">
                      {p.reference}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setToast(`Downloaded invoice for ${p.reference}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications Box matching Screenshot 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Notifications</h3>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    n.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : n.type === 'warning'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {n.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : n.type === 'warning' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{n.title}</div>
                    <div className="text-slate-500 mt-0.5">{n.message}</div>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 whitespace-nowrap ml-4">
                  {n.created_at}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
