import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import {
  Inbox,
  Send,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Pause,
  Play,
  Check,
  Search,
  Bell,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function MessengerInbox() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateName, setSimulateName] = useState('Tanvir Khan');
  const [simulateText, setSimulateText] = useState('Panjabi Eid collection size L er stock ache? Price koto?');
  const [toast, setToast] = useState(null);

  const fetchThreads = async () => {
    try {
      const res = await fetch(`/api/messenger/threads?tab=${activeTab}&search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads);
        if (!selectedThread && data.threads.length > 0) {
          selectThread(data.threads[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectThread = async (id) => {
    try {
      const res = await fetch(`/api/messenger/threads/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedThread(data.thread);
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedThread) return;

    try {
      const res = await fetch(`/api/messenger/threads/${selectedThread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'agent', text: inputMsg })
      });
      const data = await res.json();
      if (data.success) {
        setInputMsg('');
        selectThread(selectedThread.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBot = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`/api/messenger/threads/${selectedThread.id}/toggle-bot`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        setSelectedThread(data.thread);
        setThreads(prev => prev.map(t => t.id === data.thread.id ? data.thread : t));
        setToast(`AI Auto-Pilot toggled to ${data.thread.bot_active ? 'ON' : 'OFF'}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmOrderFromChat = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`/api/messenger/threads/${selectedThread.id}/confirm-order`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Order #${data.order_id} created by AI bot and sent to n8n!`);
        setTimeout(() => setToast(null), 4000);
        selectThread(selectedThread.id);
        fetchThreads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/messenger/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: simulateName, text: simulateText })
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Customer simulated! AI bot automatically responded in chat.`);
        setTimeout(() => setToast(null), 4000);
        setIsSimulateModalOpen(false);
        fetchThreads();
        selectThread(data.thread.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <TopNav breadcrumb="WORKSPACE / MESSENGER" title="Customer Inbox" onRefresh={() => selectThread(selectedThread?.id)}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 text-slate-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>458 handled by AI</span>
        </div>
        <button
          onClick={() => {
            setToast('Realtime notification sound alerts enabled.');
            setTimeout(() => setToast(null), 3000);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition shadow-2xs"
        >
          <Bell className="w-3.5 h-3.5 text-slate-500" />
          <span>Enable alerts</span>
        </button>
        <button
          onClick={() => setIsSimulateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-lime hover:bg-[#95db28] text-slate-950 text-xs font-bold transition shadow-2xs"
        >
          <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
          <span>Simulate customer</span>
        </button>
      </TopNav>

      <div className="p-6 max-w-7xl mx-auto">
        {toast && (
          <div className="mb-4 p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </div>
        )}

        {/* 3-Column Container matching Screenshot 9 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row h-[780px] overflow-hidden">
          {/* Column 1: Threads List (Width: 320px) */}
          <div className="w-full lg:w-80 border-r border-slate-200/80 flex flex-col bg-white flex-shrink-0">
            {/* Search Input */}
            <div className="p-3.5 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && fetchThreads()}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-3 py-2 border-b border-slate-100 gap-1 text-[11px] font-semibold text-slate-500">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                All open 12
              </button>
              <button
                onClick={() => setActiveTab('needs_human')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'needs_human' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Needs human 3
              </button>
              <button
                onClick={() => setActiveTab('bot_active')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'bot_active' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Bot active 9
              </button>
            </div>

            {/* Threads List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {threads.map((t) => {
                const isSelected = selectedThread?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectThread(t.id)}
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                      isSelected ? 'bg-slate-50 border-l-4 border-l-brand-lime' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <img
                      src={t.customer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={t.customer_name}
                      className="w-9 h-9 rounded-full object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {t.customer_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.last_message_time || '4d'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mb-1.5">
                        {t.last_message}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.bot_active ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Bot Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Needs human
                          </span>
                        )}

                        {t.order_id && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 font-mono">
                            {t.order_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Live Chat Center View */}
          <div className="flex-1 flex flex-col bg-slate-50/30">
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedThread.customer_avatar}
                      alt={selectedThread.customer_name}
                      className="w-9 h-9 rounded-full object-cover bg-slate-100"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{selectedThread.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{selectedThread.page_name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {selectedThread.bot_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Bot Active
                      </span>
                    ) : null}

                    {selectedThread.order_id && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        {selectedThread.order_id} - {selectedThread.order_status || 'Confirmed'}
                      </span>
                    )}

                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700">AI Auto-Pilot</span>
                      <button
                        onClick={handleToggleBot}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          selectedThread.bot_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          selectedThread.bot_active ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600 ml-1">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Bubble History */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((m) => {
                    const isBot = m.sender === 'bot';
                    const isCustomer = m.sender === 'customer';

                    // Order draft card bubble
                    if (m.message_type === 'order_card' && m.payload) {
                      return (
                        <div key={m.id} className="max-w-md mx-auto my-2">
                          <div className="bg-[#111827] text-white rounded-2xl p-4 shadow-lg border border-slate-700 text-xs">
                            <div className="space-y-1 pb-3 border-b border-slate-700">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subtotal:</span>
                                <span className="font-mono">৳{m.payload.subtotal?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Delivery fee (Inside Dhaka):</span>
                                <span className="font-mono">৳{m.payload.delivery_fee}</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold text-brand-lime pt-1">
                                <span>Total payable on delivery (COD):</span>
                                <span className="font-mono">৳{m.payload.total?.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="py-3 space-y-1.5 border-b border-slate-700 text-[11px]">
                              <div>👤 <span className="text-slate-400">Name:</span> {m.payload.name}</div>
                              <div>📞 <span className="text-slate-400">Phone:</span> {m.payload.phone}</div>
                              <div>📍 <span className="text-slate-400">Address:</span> {m.payload.address}</div>
                            </div>

                            <div className="pt-3">
                              <div className="text-[11px] text-slate-300 mb-2.5">
                                Is everything correct? Type "Confirm" or "Yes" to place the order.
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleConfirmOrderFromChat}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                                >
                                  <Check className="w-3.5 h-3.5" /> Confirm
                                </button>
                                <button
                                  onClick={() => setToast('Edit mode opened')}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-600"
                                >
                                  ✏ Change
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Order confirmation badge bubble
                    if (m.message_type === 'order_confirmation') {
                      return (
                        <div key={m.id} className="flex justify-center my-2">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            {m.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isCustomer
                            ? 'bg-slate-800 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-bl-xs'
                        }`}>
                          {m.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {isBot ? 'AI · ' : ''}{m.created_at}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Chat Message Input */}
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="text-[11px] text-slate-400 text-center mb-2">
                    {selectedThread.is_window_closed ? (
                      <span>Messenger window closed — the customer must message first</span>
                    ) : (
                      <span>AI Auto-Pilot is active (replies and creates orders automatically). Enter to send</span>
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message to customer..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-brand-lime hover:bg-[#95db28] text-slate-950 font-bold text-xs transition shadow-2xs"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a conversation thread to view
              </div>
            )}
          </div>

          {/* Column 3: Customer & Order Details Drawer (Width: 320px) matching Screenshot 9 */}
          {selectedThread && (
            <div className="w-full lg:w-80 border-l border-slate-200/80 bg-white p-5 flex flex-col justify-between overflow-y-auto flex-shrink-0 text-xs">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  CUSTOMER & ORDER
                </div>

                {/* Customer Profile Box */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    CUSTOMER
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={selectedThread.customer_avatar}
                      alt={selectedThread.customer_name}
                      className="w-10 h-10 rounded-full object-cover bg-slate-100"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{selectedThread.customer_name}</div>
                      <div className="text-[11px] text-slate-400">Since {selectedThread.customer_since || '10/26/2026'}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono font-medium text-slate-800">{selectedThread.customer_phone || '01998048911'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PSID:</span>
                      <span className="font-mono text-slate-800">{selectedThread.psid || '4009589675668210'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Page:</span>
                      <span className="text-slate-800 font-medium">{selectedThread.page_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Window:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Closed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Started from comment */}
                {selectedThread.started_from_comment && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      STARTED FROM COMMENT
                    </div>
                    <div className="text-slate-700 italic text-[11px]">
                      "{selectedThread.started_from_comment}"
                    </div>
                  </div>
                )}

                {/* AI Auto-Pilot Switch Card */}
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">AI AUTO-PILOT</span>
                    <button
                      onClick={handleToggleBot}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        selectedThread.bot_active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        selectedThread.bot_active ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    The AI answers, collects order details and places COD orders after the customer confirms.
                  </p>
                  <button
                    onClick={handleToggleBot}
                    className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition"
                  >
                    {selectedThread.bot_active ? 'Pause AI / Take over' : 'Activate AI Auto-Pilot'}
                  </button>
                </div>

                {/* Order Draft Box matching screenshot */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ORDER DRAFT</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      ORDER PLACED
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-600">
                    <div><span className="text-slate-400">Name:</span> {selectedThread.customer_name}</div>
                    <div><span className="text-slate-400">Phone:</span> {selectedThread.customer_phone || '01998048911'}</div>
                    <div><span className="text-slate-400">Address:</span> house 22, apt#3B, north badda, dhaka - Inside Dhaka</div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setToast('Edit order modal opened')}
                      className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-50"
                    >
                      Edit details
                    </button>
                    <button
                      onClick={handleConfirmOrderFromChat}
                      className="flex-1 py-1.5 rounded-lg bg-brand-lime text-slate-950 font-bold text-[11px] hover:bg-[#95db28]"
                    >
                      Place order
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Confirmed Bottom Tag */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-800">ORDER {selectedThread.order_id || '#ORD-95301'}</span>
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CONFIRMED
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulate Customer Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Simulate Customer Message</h3>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateCustomer} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={simulateName}
                  onChange={(e) => setSimulateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Incoming Message</label>
                <textarea
                  required
                  rows={3}
                  value={simulateText}
                  onChange={(e) => setSimulateText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-[11px]">
                ⚡ AI Auto-Pilot will answer immediately and send order draft cards!
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
                  Send & Simulate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
