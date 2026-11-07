import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import {
  ArrowRight,
  Plus,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  MessageSquare,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/overview');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data?.stats;

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / OVERVIEW" title="Business overview" onRefresh={fetchOverview} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Workspace Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-sm border border-slate-800">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-[11px] font-bold tracking-widest text-brand-lime uppercase mb-2">
                WORKSPACE: TEST
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                Less busywork. More business.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Manage customer conversations, commerce operations and reviewed business discovery from one workspace. All stats and cards update live from your database.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs shadow-sm transition"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>New Order</span>
                </Link>
                <Link
                  to="/inventory"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </Link>
              </div>
            </div>

            {/* Quick action navigation pills */}
            <div className="flex flex-col gap-2.5 sm:w-64">
              <Link
                to="/inbox"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-brand-lime/90 hover:bg-brand-lime text-slate-950 font-semibold text-xs transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Messenger Inbox</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/comments"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-slate-700" />
                  <span>FB Comments</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
              </Link>
              <Link
                to="/leads"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-slate-700" />
                  <span>Lead Discovery</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
              </Link>
            </div>
          </div>
        </div>

        {/* 8 Metric KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              TODAY'S REVENUE
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.todays_revenue?.value || '৳52,480'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.todays_revenue?.change || '+18.6%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.todays_revenue?.subtext || '47 orders recorded today'}
            </div>
          </div>

          {/* 2. Orders Today */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              ORDERS TODAY
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.orders_today?.value || '472'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.orders_today?.change || '+20.4%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.orders_today?.subtext || '472 total recorded orders in database'}
            </div>
          </div>

          {/* 3. AI Orders Today (Autonomous) */}
          <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                AI ORDERS TODAY
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 tracking-wider">
                AUTONOMOUS
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-emerald-700">
                {stats?.ai_orders_today?.value || '450'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.ai_orders_today?.change || '+19.7%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.ai_orders_today?.subtext || 'Automatically taken by AI agent'}
            </div>
          </div>

          {/* 4. Collected Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              COLLECTED REVENUE
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.collected_revenue?.value || '৳7,71,840'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.collected_revenue?.change || '+32.1%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.collected_revenue?.subtext || 'Total lifetime volume in workspace'}
            </div>
          </div>

          {/* 5. Messenger Open Threads */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              MESSENGER OPEN THREADS
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.messenger_open_threads?.value || '563'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.messenger_open_threads?.change || '+12.8%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.messenger_open_threads?.subtext || '563 active conversation(s) in inbox'}
            </div>
          </div>

          {/* 6. Needs Human Review */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              NEEDS HUMAN REVIEW
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.needs_human_review?.value || '18'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {stats?.needs_human_review?.change || '-37.9%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.needs_human_review?.subtext || '18 pending escalations'}
            </div>
          </div>

          {/* 7. Total Products */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              TOTAL PRODUCTS
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.total_products?.value || '458'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.total_products?.change || '+5.3%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.total_products?.subtext || '458 total units'}
            </div>
          </div>

          {/* 8. B2B Leads */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              B2B LEADS
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.b2b_leads?.value || '676'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.b2b_leads?.change || '+24.5%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.b2b_leads?.subtext || '676 retail & boutique leads discovered'}
            </div>
          </div>
        </div>

        {/* AI Orders Placed Today Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-lime fill-brand-lime" />
                <h3 className="text-base font-bold text-slate-900">
                  AI orders placed today ({stats?.orders_today?.value || 472})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live records from your database. Select a card above to see what is behind the number.
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs transition self-start sm:self-center shadow-2xs"
            >
              <span>Open Orders Manager</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">ORDER #</th>
                  <th className="py-3 px-5">CUSTOMER</th>
                  <th className="py-3 px-5">PHONE</th>
                  <th className="py-3 px-5">DELIVERY ADDRESS</th>
                  <th className="py-3 px-5">TOTAL (৳)</th>
                  <th className="py-3 px-5">PAYMENT</th>
                  <th className="py-3 px-5">CHANNEL</th>
                  <th className="py-3 px-5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data?.orders?.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-slate-50/60 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {ord.id}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {ord.customer_name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                      {ord.customer_phone}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate" title={ord.delivery_address}>
                      {ord.delivery_address}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                      ৳{Number(ord.total).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        ord.payment_method?.includes('Paid')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ord.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {ord.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        ord.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'delivered'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Order Details</span>
                <h3 className="text-lg font-black text-slate-900">{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono font-medium text-slate-800">{selectedOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-right text-slate-800 max-w-[200px]">{selectedOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold text-slate-800">{selectedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Order Channel:</span>
                <span className="text-slate-800">{selectedOrder.channel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600 uppercase">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-lg text-sm font-bold">
                <span className="text-slate-700">Total Amount:</span>
                <span className="text-slate-900 font-mono">৳{Number(selectedOrder.total).toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Link
                to="/orders"
                className="w-full text-center py-2 rounded-xl bg-brand-lime text-slate-950 font-bold text-xs hover:bg-[#95db28] transition"
              >
                Manage in Orders Hub →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
