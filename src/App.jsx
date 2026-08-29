import React from 'react';
import { CaseProvider, useCaseContext } from './context/CaseContext';
import { Navbar } from './components/common/Navbar';
import { TheatreCurtain } from './components/common/TheatreCurtain';
import { OpsDashboard } from './components/ops/OpsDashboard';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { ShowManager } from './components/ops/ShowManager';
import { AnalyticsDashboard } from './components/ops/AnalyticsDashboard';

function AppContent() {
  const { activeRole, isCurtainAnimating } = useCaseContext();

  return (
    <div className="app-container">
      {/* Smooth 1.1s Theatre Curtain Transition Overlay on Logo Click */}
      <TheatreCurtain isAnimating={isCurtainAnimating} />

      <Navbar />

      {activeRole === 'customer' && <CustomerPortal />}
      {activeRole === 'ops' && <OpsDashboard />}
      {activeRole === 'analytics' && <AnalyticsDashboard />}
      {activeRole === 'inventory' && <ShowManager />}
    </div>
  );
}

export default function App() {
  return (
    <CaseProvider>
      <AppContent />
    </CaseProvider>
  );
}
