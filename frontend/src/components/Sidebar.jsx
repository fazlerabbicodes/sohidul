import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Crosshair,
  MessageSquare,
  Inbox,
  ClipboardList,
  ShieldAlert,
  Package,
  Bot,
  TrendingUp,
  Truck,
  Share2,
  CreditCard,
  Zap,
  Bell,
  LogOut,
  Send
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const workspaceLinks = [
    { name: 'Overview', to: '/', icon: LayoutGrid },
    { name: 'Lead Discovery', to: '/leads', icon: Crosshair },
    { name: 'FB Comments', to: '/comments', icon: MessageSquare },
    { name: 'Messenger Inbox', to: '/inbox', icon: Inbox },
    { name: 'Orders', to: '/orders', icon: ClipboardList },
    { name: 'Fraud Shield', to: '/fraud', icon: ShieldAlert },
    { name: 'Inventory', to: '/inventory', icon: Package },
  ];

  const aiOpsLinks = [
    { name: 'AI Agent', to: '/ai-agent', icon: Bot },
    { name: 'Analytics', to: '/analytics', icon: TrendingUp },
    { name: 'Courier Hub', to: '/couriers', icon: Truck },
  ];

  const settingsLinks = [
    { name: 'Facebook Pages', to: '/facebook-pages', icon: Share2 },
    { name: 'Subscription', to: '/subscription', icon: CreditCard },
    { name: 'n8n Automation', to: '/automation', icon: Zap, badge: 'n8n' },
  ];

  const renderNavGroup = (title, items) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-800 text-brand-lime font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-lime' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-brand-lime/20 text-brand-lime uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-200 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800/80 z-20 flex-shrink-0">
      {/* Top Logo Brand */}
      <div>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/60">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-brand-lime flex items-center justify-center border border-emerald-500/30">
              <Send className="w-4 h-4 text-emerald-400 -rotate-45" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              CommercePilot <span className="text-emerald-400">AI</span>
            </span>
          </NavLink>
          <button className="relative p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0f172a]" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {renderNavGroup('WORKSPACE', workspaceLinks)}
          {renderNavGroup('AI & OPERATIONS', aiOpsLinks)}
          {renderNavGroup('SETTINGS', settingsLinks)}
        </div>
      </div>

      {/* Bottom Profile Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-brand-lime text-slate-950 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              T
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white leading-tight">Test</div>
              <div className="text-[11px] text-slate-400 truncate">saad125862@gmail.com</div>
            </div>
          </div>
          <button className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
