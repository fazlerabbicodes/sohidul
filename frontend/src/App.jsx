import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import LeadDiscovery from './pages/LeadDiscovery';
import FBComments from './pages/FBComments';
import MessengerInbox from './pages/MessengerInbox';
import Orders from './pages/Orders';
import FraudShield from './pages/FraudShield';
import Inventory from './pages/Inventory';
import Subscription from './pages/Subscription';
import N8nAutomation from './pages/N8nAutomation';
import AiAgent from './pages/AiAgent';
import Analytics from './pages/Analytics';
import CourierHub from './pages/CourierHub';
import FacebookPages from './pages/FacebookPages';

export default function App() {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/overview" element={<Navigate to="/" replace />} />
          <Route path="/leads" element={<LeadDiscovery />} />
          <Route path="/comments" element={<FBComments />} />
          <Route path="/inbox" element={<MessengerInbox />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/fraud" element={<FraudShield />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/automation" element={<N8nAutomation />} />
          <Route path="/ai-agent" element={<AiAgent />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/couriers" element={<CourierHub />} />
          <Route path="/facebook-pages" element={<FacebookPages />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
