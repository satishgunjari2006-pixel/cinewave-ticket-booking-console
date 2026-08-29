import React, { useState, useEffect } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { BookingWizard } from './BookingWizard';
import { ApprovalCheckpoint } from './ApprovalCheckpoint';

export function CustomerPortal() {
  const { customerActiveCaseId, homeResetCount } = useCaseContext();
  const [activeTab, setActiveTab] = useState(customerActiveCaseId ? 'checkpoint' : 'new_request');
  const [currentCreatedCaseId, setCurrentCreatedCaseId] = useState(customerActiveCaseId || '');

  // Reset to new booking request step 1 whenever home logo is clicked
  useEffect(() => {
    setActiveTab('new_request');
    setCurrentCreatedCaseId('');
  }, [homeResetCount]);

  // If customerActiveCaseId is set, open confirmation checkpoint
  useEffect(() => {
    if (customerActiveCaseId) {
      setActiveTab('checkpoint');
      setCurrentCreatedCaseId(customerActiveCaseId);
    }
  }, [customerActiveCaseId]);

  const handleBookingCreated = (newCase) => {
    setCurrentCreatedCaseId(newCase.caseId);
    setActiveTab('checkpoint');
  };

  return (
    <div className="customer-portal-wrap">
      {/* Portal Tab Switcher */}
      <nav className="portal-nav-bar" aria-label="Customer Flow Navigation">
        <button
          type="button"
          className={`portal-nav-btn ${activeTab === 'new_request' ? 'active' : ''}`}
          onClick={() => setActiveTab('new_request')}
        >
          1. New Booking Request (Initial Stage)
        </button>

        <button
          type="button"
          className={`portal-nav-btn ${activeTab === 'checkpoint' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkpoint')}
        >
          2. Stage 3 Approval Checkpoint & Case Tracker
        </button>
      </nav>

      {/* Active Tab View */}
      {activeTab === 'new_request' ? (
        <BookingWizard key={`wizard-${homeResetCount}`} onBookingCreated={handleBookingCreated} />
      ) : (
        <ApprovalCheckpoint defaultCaseId={currentCreatedCaseId || customerActiveCaseId} />
      )}
    </div>
  );
}