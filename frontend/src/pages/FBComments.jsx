import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import {
  MessageSquare,
  Zap,
  Send,
  Search,
  RotateCcw,
  Settings,
  X,
  ExternalLink,
  TrendingUp,
  MessageCircle,
  Sparkles
} from 'lucide-react';

export default function FBComments() {
  const [stats, setStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState('All Facebook Pages');
  const [selectedSentiment, setSelectedSentiment] = useState('All Sentiments');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Simulation state
  const [simulateData, setSimulateData] = useState({
    author_name: 'Saad Ahmed',
    page_name: 'Precision Trading BD',
    comment_text: 'White polo XL Available?? Price koto?'
  });

  const fetchData = async () => {
    try {
      let url = `/api/comments?tab=${activeTab}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (selectedPage !== 'All Facebook Pages') url += `page_name=${encodeURIComponent(selectedPage)}&`;
      if (selectedSentiment !== 'All Sentiments') url += `sentiment=${encodeURIComponent(selectedSentiment)}&`;
      if (selectedCategory !== 'All Categories') url += `category=${encodeURIComponent(selectedCategory)}&`;

      const [resStats, resComments] = await Promise.all([
        fetch('/api/comments/stats').then(r => r.json()),
        fetch(url).then(r => r.json())
      ]);

      if (resStats.success) setStats(resStats.stats);
      if (resComments.success) setComments(resComments.comments);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedPage, selectedSentiment, selectedCategory]);

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/comments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulateData)
      });
      const data = await res.json();
      if (data.success) {
        setToast(`AI generated autonomous reply and dispatched Messenger DM! n8n webhook triggered.`);
        setTimeout(() => setToast(null), 4000);
        setIsSimulateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHandover = async (id, author) => {
    try {
      const res = await fetch(`/api/comments/${id}/handover`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToast(`Dispatched Messenger direct message thread for ${author}`);
        setTimeout(() => setToast(null), 3000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / FACEBOOK ENGAGEMENT" title="Autonomous AI Comment & Messenger Engine" onRefresh={fetchData}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 text-slate-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>5 Page(s) Connected</span>
        </div>
        <Link
          to="/facebook-pages"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition shadow-2xs"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Page settings</span>
        </Link>
      </TopNav>

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {toast && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* Subtitle description */}
        <p className="text-xs text-slate-500">
          Automation follows each Page's settings • Public AI replies and Messenger direct messages go out only when switched on under Facebook Pages → Configure, with optional manual approval.
        </p>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              AI AUTO-REPLIED
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-emerald-600">
                {stats?.ai_auto_replied?.value || 456}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.ai_auto_replied?.change || '+24.8%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.ai_auto_replied?.subtext || 'Comments the AI answered on its own'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              MESSENGER DMS DISPATCHED
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.messenger_dms_dispatched?.value || 481}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.messenger_dms_dispatched?.change || '+21.4%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.messenger_dms_dispatched?.subtext || 'Instant private replies to commenters'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              TOTAL CUSTOMER COMMENTS
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.total_customer_comments?.value || 782}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.total_customer_comments?.change || '+18.9%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.total_customer_comments?.subtext || 'Live Facebook comments handled by AI'}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              SPAM AUTO-FILTERED
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-black text-slate-900">
                {stats?.spam_auto_filtered?.value || 67}
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> {stats?.spam_auto_filtered?.change || '+36.7%'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {stats?.spam_auto_filtered?.subtext || 'Spam, promo links & blocked bots'}
            </div>
          </div>
        </div>

        {/* Instant AI Comment & Direct Message Engine Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Instant AI Comment & Direct Message Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              When auto-reply is on for a Page, the AI answers comments after the delay you set and opens a Messenger DM for purchase questions. With manual approval on, replies wait for you here.
            </p>
          </div>

          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs transition shadow-sm whitespace-nowrap"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Simulate incoming comment</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Comments 782
          </button>
          <button
            onClick={() => setActiveTab('replied')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'replied'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            AI auto-replied 456
          </button>
          <button
            onClick={() => setActiveTab('spam')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'spam'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Auto-filtered (spam) 67
          </button>
        </div>

        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search comments or commenter name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none shadow-2xs"
          >
            <option>All Facebook Pages</option>
            <option>Precision Trading BD</option>
            <option>Fashion House BD</option>
            <option>Gadget Zone BD</option>
          </select>

          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none shadow-2xs"
          >
            <option>All Sentiments</option>
            <option>Positive</option>
            <option>Neutral</option>
            <option>Negative</option>
          </select>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none shadow-2xs"
            >
              <option>All Categories</option>
              <option>product availability</option>
              <option>product price inquiry</option>
              <option>product recommendation</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPage('All Facebook Pages');
                setSelectedSentiment('All Sentiments');
                setSelectedCategory('All Categories');
                fetchData();
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Comment Threads List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
              <span>All Comment Threads</span>
            </div>
            <span>Showing 1–{comments.length} of 782 comments</span>
          </div>

          {comments.map((cm) => (
            <div key={cm.id} className="p-6 hover:bg-slate-50/40 transition">
              <div className="flex items-start gap-4">
                <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
                <img
                  src={cm.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={cm.author_name}
                  className="w-10 h-10 rounded-full object-cover bg-slate-100 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-slate-900 text-xs">{cm.author_name}</span>
                      <span className="text-[11px] text-slate-500">on <span className="font-semibold text-slate-700">{cm.page_name}</span></span>
                      {cm.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {cm.category}
                        </span>
                      )}
                      {cm.sentiment && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cm.sentiment === 'Positive'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cm.sentiment}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHandover(cm.id, cm.author_name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                      >
                        <Send className="w-3 h-3 text-slate-500" />
                        <span>Hand over to Messenger DM</span>
                      </button>
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        Replied
                      </span>
                    </div>
                  </div>

                  {/* Customer's comment */}
                  <div className="text-xs font-semibold text-slate-800 mb-3">
                    {cm.comment_text}
                  </div>

                  {/* Sent Reply box matching screenshot */}
                  {cm.reply_text && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 font-medium mb-3">
                      {cm.reply_text}
                    </div>
                  )}

                  {/* Timestamp & Thread Actions */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cm.created_at}</span>
                    <div className="flex items-center gap-3">
                      <Link
                        to="/inbox"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        <Zap className="w-3 h-3" />
                        <span>AI chat thread</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(cm.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulate Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Simulate Incoming Comment</h3>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commenter Name</label>
                <input
                  type="text"
                  required
                  value={simulateData.author_name}
                  onChange={(e) => setSimulateData({ ...simulateData, author_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Facebook Page</label>
                <select
                  value={simulateData.page_name}
                  onChange={(e) => setSimulateData({ ...simulateData, page_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Precision Trading BD">Precision Trading BD</option>
                  <option value="Fashion House BD">Fashion House BD</option>
                  <option value="Gadget Zone BD">Gadget Zone BD</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Comment Text (Bangla, Banglish, or English)</label>
                <textarea
                  required
                  rows={3}
                  value={simulateData.comment_text}
                  onChange={(e) => setSimulateData({ ...simulateData, comment_text: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="p-3 bg-brand-lime/10 border border-brand-lime/30 rounded-xl text-slate-800 text-[11px] leading-relaxed">
                🤖 <strong>Autonomous Engine:</strong> The AI will instantly analyze sentiments, classify intent, check product inventory, generate an appropriate reply in seconds, and automatically open a private Messenger DM thread!
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-lime text-slate-950 font-bold hover:bg-[#95db28] transition"
                >
                  Dispatch Simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
