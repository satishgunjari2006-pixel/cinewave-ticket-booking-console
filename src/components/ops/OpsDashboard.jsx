import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { CaseTable } from './CaseTable';
import { CaseDrawer } from './CaseDrawer';
import { QUEUES, STAGES, STATUSES } from '../../data/types';
import { IconQueue, IconSearch, IconFilter, IconSLAClock } from '../common/Icons';

export function OpsDashboard() {
  const {
    metrics,
    cases,
    activeQueueFilter,
    setActiveQueueFilter,
    activeStageFilter,
    setActiveStageFilter,
    activeStatusFilter,
    setActiveStatusFilter,
    activeSlaFilter,
    setActiveSlaFilter,
    searchQuery,
    setSearchQuery,
    selectedCaseId,
    setSelectedCaseId,
  } = useCaseContext();

  const [activeDrawerCase, setActiveDrawerCase] = useState(null);

  const handleOpenCase = (c) => {
    setActiveDrawerCase(c);
  };

  const handleCloseDrawer = () => {
    setActiveDrawerCase(null);
  };

  // Keep drawer in sync if context updates case
  const currentCase = activeDrawerCase 
    ? cases.find(c => c.caseId === activeDrawerCase.caseId) || activeDrawerCase
    : null;

  return (
    <main className="ops-container">
      {/* 1. Operational KPI Metrics Banner */}
      <section className="metrics-strip" aria-label="Operations Overview">
        <div className="metric-card accent-crimson">
          <span className="metric-label">Active Work Items</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.activeCases}</span>
            <span className="metric-sub">{metrics.totalCases} Total</span>
          </div>
        </div>

        <div className="metric-card accent-indigo">
          <span className="metric-label">Premium ShowQueue</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.premiumQueueCount}</span>
            <span className="metric-sub">Priority SLA</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-label">Standard ShowQueue</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.standardQueueCount}</span>
            <span className="metric-sub">Standard Handling</span>
          </div>
        </div>

        <div className="metric-card accent-amber">
          <span className="metric-label">SLA At-Risk (&lt;6h Goal)</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.atRiskCount}</span>
            <span className="metric-sub">Approaching 24h</span>
          </div>
        </div>

        <div className="metric-card accent-danger">
          <span className="metric-label">SLA Breached</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.breachedCount}</span>
            <span className="metric-sub">&gt;24h / &gt;48h</span>
          </div>
        </div>

        <div className="metric-card accent-emerald">
          <span className="metric-label">Resolved & Confirmed</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.confirmedToday}</span>
            <span className="metric-sub">Tickets Executed</span>
          </div>
        </div>
      </section>

      {/* 2. Ops Dispatch Filter Toolbar */}
      <section className="ops-toolbar" aria-label="Dispatch Controls">
        <div className="toolbar-left">
          {/* Work Queue Tabs */}
          <div className="queue-tabs">
            <button
              type="button"
              className={`queue-tab-btn ${activeQueueFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveQueueFilter('ALL')}
            >
              <IconQueue size={13} />
              <span>All Work Queues</span>
              <span className="tab-badge">{metrics.totalCases}</span>
            </button>

            <button
              type="button"
              className={`queue-tab-btn ${activeQueueFilter === QUEUES.PREMIUM ? 'active' : ''}`}
              onClick={() => setActiveQueueFilter(QUEUES.PREMIUM)}
            >
              <span>Premium ShowQueue</span>
              <span className="tab-badge" style={{ color: '#A5B4FC' }}>{metrics.premiumQueueCount}</span>
            </button>

            <button
              type="button"
              className={`queue-tab-btn ${activeQueueFilter === QUEUES.STANDARD ? 'active' : ''}`}
              onClick={() => setActiveQueueFilter(QUEUES.STANDARD)}
            >
              <span>Standard ShowQueue</span>
              <span className="tab-badge">{metrics.standardQueueCount}</span>
            </button>
          </div>

          {/* SLA Filter Dropdown */}
          <select 
            className="filter-select"
            value={activeSlaFilter}
            onChange={(e) => setActiveSlaFilter(e.target.value)}
          >
            <option value="ALL">All SLA Urgencies</option>
            <option value="ON_TRACK">SLA: On Track</option>
            <option value="AT_RISK">SLA: At Risk (&lt;6h Goal)</option>
            <option value="BREACHED">SLA: Breached (Goal or Deadline)</option>
          </select>

          {/* Stage Filter Dropdown */}
          <select 
            className="filter-select"
            value={activeStageFilter}
            onChange={(e) => setActiveStageFilter(e.target.value)}
          >
            <option value="ALL">All Stages</option>
            <option value="Initial">Stage 1: Initial Stage</option>
            <option value="Availability">Stage 2: Availability</option>
            <option value="Approval">Stage 3: Approval</option>
            <option value="Execution">Stage 4: Booking Execution</option>
          </select>

          {/* Status Filter Dropdown */}
          <select 
            className="filter-select"
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value={STATUSES.NEW}>New</option>
            <option value={STATUSES.PENDING_AVAILABILITY}>Pending-Availability</option>
            <option value={STATUSES.PENDING_APPROVAL}>Pending-Approval</option>
            <option value={STATUSES.RESOLVED_CONFIRMED}>Resolved-Confirmed</option>
            <option value={STATUSES.RESOLVED_CANCELLED}>Resolved-Cancelled</option>
            <option value={STATUSES.RESOLVED_REFUNDED}>Resolved-Refunded</option>
          </select>
        </div>

        <div className="toolbar-right">
          {/* Search Box */}
          <div className="search-box">
            <IconSearch size={14} className="search-icon" />
            <input 
              type="text"
              placeholder="Search Case ID, customer, movie..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 3. Full-Width Clean Table */}
      <section className="ops-table-wrap">
        <CaseTable onOpenCase={handleOpenCase} />
      </section>

      {/* 4. Slide-Out Case Inspector Drawer */}
      {currentCase && (
        <CaseDrawer caseItem={currentCase} onClose={handleCloseDrawer} />
      )}
    </main>
  );
}
