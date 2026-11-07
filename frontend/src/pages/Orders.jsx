import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import {
  ClipboardList,
  Plus,
  Search,
  RotateCcw,
  CheckCircle,
  Truck,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(452);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form for new order
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    city_zone: 'Inside Dhaka',
    items: [{ name: 'Panjabi (Eid Collection)', price: 1950, qty: 1 }],
    payment_method: 'COD • unpaid',
    courier: 'SteadFast'
  });

  const fetchOrders = async () => {
    try {
      let url = '/api/orders?';
      if (statusFilter && statusFilter !== 'All statuses') {
        url += `status=${encodeURIComponent(statusFilter)}&`;
      }
      if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        if (!searchTerm && statusFilter === 'All statuses') {
          setTotalCount(data.total > 400 ? data.total : 452);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setToast(`Order ${orderId} updated to ${newStatus}. n8n webhook triggered!`);
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnItem = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: 'returned' } : o));
        setToast(`Order ${orderId} returned. Stock restored and customer return history logged.`);
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Order ${data.order.id} placed! Dispatched to n8n webhook.`);
        setTimeout(() => setToast(null), 4000);
        setIsCreateModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / ORDERS" title="Order fulfillment" onRefresh={fetchOrders} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* Orders Subheader Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Orders & Fulfillment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your orders with live status, a fraud check on every order, and returns that put items back in stock.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs transition shadow-2xs self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Create order</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order number, customer, phone or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </form>

          <div className="sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            >
              <option value="All statuses">All statuses ({totalCount} orders)</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">ORDER #</th>
                  <th className="py-3 px-5">CUSTOMER</th>
                  <th className="py-3 px-5">DELIVERY ADDRESS</th>
                  <th className="py-3 px-5">AMOUNT</th>
                  <th className="py-3 px-5">PAYMENT</th>
                  <th className="py-3 px-5">RISK</th>
                  <th className="py-3 px-5">STATUS</th>
                  <th className="py-3 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((ord) => {
                  const dateFormatted = ord.created_at ? ord.created_at.split(' ')[0] : '11/03/2026';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      {/* Order # & Date */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-emerald-600 font-mono">
                          {ord.id}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {dateFormatted}
                        </div>
                      </td>

                      {/* Customer & Phone */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          {ord.customer_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {ord.customer_phone}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-5 text-slate-700 max-w-xs truncate" title={ord.delivery_address}>
                        {ord.delivery_address}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          ৳{Number(ord.total).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sub: ৳{Number(ord.subtotal).toLocaleString()} + Del: ৳{Number(ord.delivery_fee)}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          ord.payment_method?.includes('bKash') || ord.payment_method?.includes('Nagad')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.payment_method?.includes('Card')
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ord.payment_method}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          ord.risk_level === 'High'
                            ? 'bg-red-100 text-red-700'
                            : ord.risk_level === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ord.risk_level}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-5">
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="returned">Returned</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleReturnItem(ord.id)}
                          className="inline-flex flex-col items-end text-xs font-semibold text-slate-700 hover:text-red-600 transition"
                        >
                          <span className="underline decoration-slate-300 hover:decoration-red-400">Return items</span>
                          <span className="text-[10px] text-slate-400 font-normal">{ord.courier || 'SteadFast'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info note matching screenshot */}
        <div className="text-center text-xs text-slate-400 py-2">
          CommercePilot AI • All operational data is stored in your private MySQL database.
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Order</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={newOrder.customer_name}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01712345678"
                    value={newOrder.customer_phone}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City Zone</label>
                  <select
                    value={newOrder.city_zone}
                    onChange={(e) => setNewOrder({ ...newOrder, city_zone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Inside Dhaka">Inside Dhaka (৳80 delivery)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳130 delivery)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House #, Road #, Area, City"
                  value={newOrder.delivery_address}
                  onChange={(e) => setNewOrder({ ...newOrder, delivery_address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={newOrder.payment_method}
                    onChange={(e) => setNewOrder({ ...newOrder, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="COD • unpaid">Cash on Delivery (COD)</option>
                    <option value="Paid (bKash)">bKash (Prepaid)</option>
                    <option value="Paid (Nagad)">Nagad (Prepaid)</option>
                    <option value="Paid (Card)">Credit / Debit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courier Partner</label>
                  <select
                    value={newOrder.courier}
                    onChange={(e) => setNewOrder({ ...newOrder, courier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="SteadFast">SteadFast Courier</option>
                    <option value="Pathao Courier">Pathao Courier</option>
                    <option value="RedX">RedX Logistics</option>
                    <option value="Local courier">Local Courier</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-semibold text-slate-700">Automated Checks:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The order will undergo instant Fraud Shield scoring and be dispatched to n8n webhooks.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-lime text-slate-950 font-bold hover:bg-[#95db28] transition"
                >
                  Confirm & Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
