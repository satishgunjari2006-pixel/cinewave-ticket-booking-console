import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { IconFilmReel, IconQueue, IconTicketStub, IconSliders, IconSLAClock } from './Icons';
import { SLATimeTravel } from '../ops/SLATimeTravel';
import { LocationModal } from '../customer/LocationModal';

export function Navbar() {
  const { 
    activeRole, 
    setActiveRole, 
    selectedCity,
    selectedState,
    setLocation,
    triggerHomeCurtainTransition,
    metrics, 
    timeOffsetMinutes, 
    resetData 
  } = useCaseContext();

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const formatOffset = (mins) => {
    if (mins === 0) return 'Live Clock';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `+${h}h ${m > 0 ? `${m}m` : ''} Sim`;
  };

  return (
    <>
      <header className="app-navbar">
        {/* Brand Logo with Theatre Curtain Transition */}
        <div className="brand-section">
          <button 
            type="button" 
            className="brand-link-btn"
            onClick={triggerHomeCurtainTransition}
            title="Return to Home Screen (Theatre Curtain Opening)"
          >
            <div className="brand-logo">
              <IconFilmReel size={20} />
            </div>
            <div className="brand-title-wrap">
              <div className="brand-title">CINEWAVE</div>
              <span className="brand-subtitle">Box Office Console</span>
            </div>
          </button>

          {/* 3-Level Location Selector Badge */}
          <button
            type="button"
            className="location-pill-btn"
            onClick={() => setShowLocationModal(true)}
            title="Change City / State"
          >
            <span className="pin-icon">📍</span>
            <div className="location-text-wrap">
              <span className="loc-city">{selectedCity}</span>
              <span className="loc-state">{selectedState}</span>
            </div>
            <span className="caret-down">▾</span>
          </button>
        </div>

        {/* Role Navigation */}
        <nav className="role-switcher" aria-label="Role Navigation">
          <button
            type="button"
            className={`role-tab-btn ${activeRole === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveRole('customer')}
          >
            <IconTicketStub size={15} />
            <span>Customer Portal</span>
          </button>

          <button
            type="button"
            className={`role-tab-btn ${activeRole === 'ops' ? 'active' : ''}`}
            onClick={() => setActiveRole('ops')}
          >
            <IconQueue size={15} />
            <span>Ops Console</span>
            <span className="tab-badge">{metrics.activeCases}</span>
          </button>

          <button
            type="button"
            className={`role-tab-btn ${activeRole === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveRole('analytics')}
          >
            <span>📊 Analytics</span>
          </button>

          <button
            type="button"
            className={`role-tab-btn ${activeRole === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveRole('inventory')}
          >
            <IconSliders size={15} />
            <span>Inventory</span>
          </button>
        </nav>

        {/* Utilities */}
        <div className="nav-actions">
          <button 
            type="button" 
            className="btn-time-travel"
            onClick={() => setShowTimeModal(true)}
            title="Open SLA Time-Travel Simulator"
          >
            <IconSLAClock size={14} />
            <span>{formatOffset(timeOffsetMinutes)}</span>
          </button>

          <button 
            type="button" 
            className="btn-reset-data"
            onClick={() => {
              if (window.confirm('Reset all cases, shows, and time simulation back to initial Indian multiplex seed data?')) {
                resetData();
              }
            }}
            title="Reset to factory seed data"
          >
            Reset Seed
          </button>
        </div>
      </header>

      {/* Modals */}
      {showTimeModal && (
        <SLATimeTravel onClose={() => setShowTimeModal(false)} />
      )}

      {showLocationModal && (
        <LocationModal
          selectedCity={selectedCity}
          onSelectLocation={setLocation}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </>
  );
}
