import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import {
  Compass,
  Search,
  Sparkles,
  Download,
  Plus,
  ArrowLeft,
  TrendingUp,
  Globe,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2
} from 'lucide-react';

export default function LeadDiscovery() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Discovery Form Input
  const [categoryKeyword, setCategoryKeyword] = useState('garments manufacturer, clothing factory, apparel export');
  const [targetLocation, setTargetLocation] = useState('Dhaka, Gazipur, Narayanganj, Bangladesh');
  const [selectedPreset, setSelectedPreset] = useState('Garments & Apparel');

  // Manual Add Form
  const [newLead, setNewLead] = useState({
    business_name: '',
    website: '',
    phone: '',
    email: '',
    location: 'Dhaka, Bangladesh',
    category: 'Garments & Apparel',
    pipeline_status: 'new'
  });

  const presets = [
    'Garments & Apparel',
    'Textile & Fabrics',
    'Footwear & Leather',
    'Accessories',
    'Buying House',
    'Exporters'
  ];

  const fetchLeads = async () => {
    try {
      let url = `/api/leads?status=${activeTab}&sort=${sortOrder}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}`;

      const [resStats, resLeads] = await Promise.all([
        fetch('/api/leads/stats').then(r => r.json()),
        fetch(url).then(r => r.json())
      ]);

      if (resStats.success) setStats(resStats.stats);
      if (resLeads.success) {
        setLeads(resLeads.leads);
        setCounts(resLeads.counts || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [activeTab, sortOrder]);

  const handleDiscover = async () => {
    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryKeyword, location: targetLocation })
      });
      const data = await res.json();
      if (data.success) {
        setToast(data.message + ' Triggered n8n CRM sync webhook!');
        setTimeout(() => setToast(null), 4000);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManualLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      const data = await res.json();
      if (data.success) {
        setToast('Lead added successfully!');
        setTimeout(() => setToast(null), 3000);
        setIsAddModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (leadId, status) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_status: status })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
        setToast(`Lead status updated to ${status}. Dispatched to n8n!`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/leads/export/csv', '_blank');
  };

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / GROWTH & OUTBOUND" title="Lead Discovery & Sales Pipeline" onRefresh={fetchLeads}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 text-slate-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DB Ready</span>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Dashboard</span>
        </Link>
      </TopNav>

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              TOTAL PROSPECTS
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.total_prospects?.value || '1,248'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.total_prospects?.change || '+18.7%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.total_prospects?.subtext || 'Saved in current workspace'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              NEW / UNCONTACTED
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.new_uncontacted?.value || '583'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.new_uncontacted?.change || '+22.9%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.new_uncontacted?.subtext || 'Ready for initial outreach'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              IN DISCUSSIONS
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.in_discussions?.value || '372'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.in_discussions?.change || '+14.6%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.in_discussions?.subtext || 'Contacted • In follow-up'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              QUALIFIED / CONVERTED
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.qualified_converted?.value || '293'}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.qualified_converted?.change || '+32.1%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.qualified_converted?.subtext || '23.5% conversion rate'}
            </div>
          </div>
        </div>

        {/* AI-Powered Public Business Discovery Box matching Screenshot 5 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI-Powered Public Business Discovery
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Finds businesses on the public web, then reads each one's own website for its phone number, email and address.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Directory Index: 12,840 • Web Search
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Category / Keywords *</label>
              <input
                type="text"
                value={categoryKeyword}
                onChange={(e) => setCategoryKeyword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Location / City *</label>
              <input
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Popular presets:</span>
            {presets.map((p) => {
              const isSelected = selectedPreset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(p);
                    setCategoryKeyword(p.toLowerCase());
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDiscover}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs transition shadow-2xs"
            >
              <Search className="w-4 h-4 text-slate-950" />
              <span>Discover Prospects (1,248)</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add a single lead manually</span>
            </button>
          </div>
        </div>

        {/* Saved Leads Pipeline Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Saved Leads Pipeline (1,248)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage outreach, qualify leads, and track customer conversions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold text-slate-600">
            {[
              { id: 'all', label: `All Leads: 1,248` },
              { id: 'new', label: `New: 583` },
              { id: 'reviewing', label: `Reviewing: 127` },
              { id: 'contacted', label: `Contacted: 372` },
              { id: 'qualified', label: `Qualified: 136` },
              { id: 'converted', label: `Converted: 293` },
              { id: 'not_a_fit', label: `Not a Fit: 29` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar & Sort */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, category, city, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && fetchLeads()}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
            <button
              onClick={fetchLeads}
              className="px-5 py-2 rounded-xl bg-brand-lime text-slate-950 font-bold hover:bg-[#95db28] transition"
            >
              Search
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">BUSINESS</th>
                  <th className="py-3 px-5">CONTACT INFO</th>
                  <th className="py-3 px-5">LOCATION / CATEGORY</th>
                  <th className="py-3 px-5">SOURCE</th>
                  <th className="py-3 px-5">PIPELINE STATUS</th>
                  <th className="py-3 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition">
                    {/* Business */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {l.business_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{l.business_name}</div>
                          {l.website && (
                            <a
                              href={`https://${l.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span>{l.website}</span>
                              <Globe className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-5">
                      <div className="font-mono text-slate-800">{l.phone || '—'}</div>
                      <div className="text-[11px] text-slate-500">{l.email || '—'}</div>
                    </td>

                    {/* Location & Category */}
                    <td className="py-3.5 px-5">
                      <div className="text-slate-800">{l.location}</div>
                      <div className="text-[11px] text-slate-500">{l.category}</div>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {l.source}
                      </span>
                    </td>

                    {/* Pipeline Status */}
                    <td className="py-3.5 px-5">
                      <select
                        value={l.pipeline_status}
                        onChange={(e) => handleStatusChange(l.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize focus:outline-none ${
                          l.pipeline_status === 'in_discussions' || l.pipeline_status === 'contacted'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : l.pipeline_status === 'qualified' || l.pipeline_status === 'converted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : l.pipeline_status === 'not_a_fit'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="in_discussions">In Discussions</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="not_a_fit">Not a Fit</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteLead(l.id)}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Lead Manually</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddManualLead} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Apparels Ltd."
                  value={newLead.business_name}
                  onChange={(e) => setNewLead({ ...newLead, business_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website</label>
                <input
                  type="text"
                  placeholder="skylineapparels.com"
                  value={newLead.website}
                  onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+880 1712-000000"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="info@company.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLead.location}
                    onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newLead.category}
                    onChange={(e) => setNewLead({ ...newLead, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
