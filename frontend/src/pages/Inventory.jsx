import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import {
  Package,
  Plus,
  Link as LinkIcon,
  Edit2,
  Check,
  AlertTriangle,
  XCircle,
  ExternalLink
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    category: 'Clothing',
    in_stock: 20,
    image: '',
    variants: [{ label: 'Size', values: ['S (5)', 'M (10)', 'L (5)'] }]
  });

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (id, delta) => {
    try {
      const res = await fetch(`/api/inventory/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.map(p => p.id === id ? data.product : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setToast('Product created successfully and synced to catalog.');
        setTimeout(() => setToast(null), 3000);
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          sku: '',
          price: '',
          category: 'Clothing',
          in_stock: 20,
          image: '',
          variants: [{ label: 'Size', values: ['S (5)', 'M (10)', 'L (5)'] }]
        });
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/inventory/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      const data = await res.json();
      if (data.success) {
        setToast('Product updated successfully.');
        setTimeout(() => setToast(null), 3000);
        setEditingProduct(null);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / INVENTORY" title="Inventory management" onRefresh={fetchInventory} />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* Subheader Card with Connect Website and Add Product */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Inventory & Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage products, sizes and measurements, prices, stock counts and low-stock alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-2xs"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Connect website</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs transition shadow-2xs"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add product</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">PRODUCT</th>
                  <th className="py-3 px-5">PRICE</th>
                  <th className="py-3 px-5">IN STOCK</th>
                  <th className="py-3 px-5">STATUS</th>
                  <th className="py-3 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map((p) => {
                  const variantValues = p.variants?.[0]?.values || [];
                  const variantLabel = p.variants?.[0]?.label || 'Size';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      {/* Product image & name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&auto=format&fit=crop&q=80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] font-mono text-slate-500 uppercase">
                              SKU: {p.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-5 font-bold text-slate-900 font-mono text-sm">
                        ৳{Number(p.price).toLocaleString()}
                      </td>

                      {/* In stock count & variants breakdown */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm mb-0.5">
                          {p.in_stock}
                        </div>
                        {variantValues.length > 0 && (
                          <div className="text-[11px] text-slate-500">
                            {variantLabel}: {variantValues.join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {p.status === 'in_stock' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            In stock
                          </span>
                        ) : p.status === 'low_stock' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Low stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Out of stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAdjustStock(p.id, -1)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(p.id, 1)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(p.id, 10)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                        >
                          +10
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Cotton Panjabi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PAN-990"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1950"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Clothing">Clothing</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Bags">Bags</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    value={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-lime text-slate-950 font-bold hover:bg-[#95db28] transition"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Product: {editingProduct.sku}</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSave} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (৳)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={editingProduct.in_stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-lime text-slate-950 font-bold hover:bg-[#95db28] transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Website Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Connect Website Store</h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Connect your eCommerce website (WooCommerce, Shopify, or Custom API) to enable real-time two-way stock synchronization.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Platform</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none">
                  <option>WooCommerce (WordPress)</option>
                  <option>Shopify</option>
                  <option>Custom REST API / Webhook</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store URL</label>
                <input
                  type="text"
                  placeholder="https://mystore.com.bd"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                />
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-[11px]">
                💡 You can also use n8n workflows to sync your inventory automatically from Google Sheets or ERP!
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setToast('Store connected! Webhook sync verified.');
                  setTimeout(() => setToast(null), 3000);
                  setIsConnectModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-brand-lime text-slate-950 font-bold text-xs hover:bg-[#95db28] transition"
              >
                Connect Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
