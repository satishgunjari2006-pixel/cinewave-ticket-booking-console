import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { STAGES, STATUSES, QUEUES, SEAT_CATEGORIES } from '../../data/types';
import { IconFilmReel, IconSeat, IconTicketStub, IconAudit, IconMail, IconSLAClock } from '../common/Icons';
import { TicketStubModal } from '../customer/TicketStubModal';

export function CaseDetail() {
  const { 
    selectedCase, 
    getCaseEntities, 
    simulatedNow, 
    runAvailabilityCheck, 
    confirmBooking, 
    cancelBooking,
    reassignShow,
    reassignQueue,
    setActiveRole,
    setCustomerActiveCaseId,
  } = useCaseContext();

  const [selectedCorrModal, setSelectedCorrModal] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [altShowModal, setAltShowModal] = useState(false);

  if (!selectedCase) {
    return (
      <div className="case-inspector-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '15px', fontWeight: '600' }}>Select a case from the queue table to view case lifecycle details</p>
      </div>
    );
  }

  const { movie, show } = getCaseEntities(selectedCase);
  const categoryConfig = SEAT_CATEGORIES[selectedCase.seatCategory] || SEAT_CATEGORIES.STANDARD;

  // Determine stage progression index (0: Intake, 1: Availability, 2: Approval, 3: Execution)
  let currentStageIdx = 0;
  if (selectedCase.stage?.includes('Availability') || selectedCase.stage === 'AVAILABILITY') currentStageIdx = 1;
  if (selectedCase.stage?.includes('Approval') || selectedCase.stage === 'APPROVAL') currentStageIdx = 2;
  if (selectedCase.stage?.includes('Execution') || selectedCase.stage === 'EXECUTION' || selectedCase.status === STATUSES.RESOLVED_CONFIRMED) currentStageIdx = 3;

  const isResolved = selectedCase.status === STATUSES.RESOLVED_CONFIRMED || selectedCase.status === STATUSES.RESOLVED_CANCELLED;

  return (
    <div className="case-inspector-card">
      {/* 1. Header & Identity */}
      <div className="inspector-header">
        <div className="case-identity">
          <div className="case-id-large">
            <span>{selectedCase.caseId}</span>
            <StatusBadge status={selectedCase.status} />
          </div>

          <div className="meta-pills">
            <QueueBadge queue={selectedCase.queue} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Created: {new Date(selectedCase.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Queue Switcher if not resolved */}
        {!isResolved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route:</span>
            <select
              className="filter-select"
              value={selectedCase.queue}
              onChange={(e) => reassignQueue(selectedCase.caseId, e.target.value)}
            >
              <option value={QUEUES.STANDARD}>Standard ShowQueue</option>
              <option value={QUEUES.PREMIUM}>Premium ShowQueue</option>
            </select>
          </div>
        )}
      </div>

      {/* 2. Customer Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--bg-inset)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>{selectedCase.customerName}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedCase.customerEmail}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedCase.customerPhone}</div>
        </div>
      </div>

      {/* 3. SLA Urgency Monitor Banner */}
      <SLABadge caseItem={selectedCase} simulatedNow={simulatedNow} variant="detailed" />

      {/* 4. 4-Stage Lifecycle Stepper */}
      <div className="stage-tracker-wrapper">
        <div className="stage-tracker-title">Case Lifecycle Stages</div>
        <div className="stage-steps-row">
          <div className={`stage-step-item ${currentStageIdx >= 0 ? (currentStageIdx > 0 ? 'completed' : 'active') : ''}`}>
            <div className="stage-step-dot">{currentStageIdx > 0 ? '✓' : '1'}</div>
            <div className="stage-step-label">1. Intake</div>
          </div>

          <div className={`stage-step-item ${currentStageIdx >= 1 ? (currentStageIdx > 1 ? 'completed' : 'active') : ''}`}>
            <div className="stage-step-dot">{currentStageIdx > 1 ? '✓' : '2'}</div>
            <div className="stage-step-label">2. Availability</div>
          </div>

          <div className={`stage-step-item ${currentStageIdx >= 2 ? (currentStageIdx > 2 ? 'completed' : 'active') : ''}`}>
            <div className="stage-step-dot">{currentStageIdx > 2 ? '✓' : '3'}</div>
            <div className="stage-step-label">3. Approval</div>
          </div>

          <div className={`stage-step-item ${currentStageIdx >= 3 ? 'active' : ''}`}>
            <div className="stage-step-dot">{selectedCase.status === STATUSES.RESOLVED_CONFIRMED ? '✓' : '4'}</div>
            <div className="stage-step-label">4. Execution</div>
          </div>
        </div>
      </div>

      {/* 5. Stage Action Workspace (Interactive based on active stage) */}
      <div className="stage-action-box">
        {selectedCase.stage?.includes('Intake') && selectedCase.status === STATUSES.NEW && (
          <>
            <div className="action-box-header">
              <div className="action-box-title">
                <span>Stage 1 Intake — Ready for Capacity Check</span>
              </div>
              <span className="tab-badge">Queue: {selectedCase.queue}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Booking request intake received for {selectedCase.seatCount} {categoryConfig.label} seat(s). Verify inventory availability against Show {selectedCase.showId}.
            </p>
            <div className="action-controls-row">
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => runAvailabilityCheck(selectedCase.caseId, 'Staff Ops Agent')}
              >
                Run Availability Check → Advance to Approval
              </button>
            </div>
          </>
        )}

        {selectedCase.stage?.includes('Availability') && (
          <>
            <div className="action-box-header">
              <div className="action-box-title">
                <span>Stage 2 Availability — Seat Inventory Verification</span>
              </div>
              <span style={{ fontSize: '11px', color: show?.seatsRemaining >= selectedCase.seatCount ? 'var(--emerald-500)' : 'var(--danger-red)', fontWeight: '700' }}>
                {show?.seatsRemaining} seats remain (Requested: {selectedCase.seatCount})
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              System checks requested {selectedCase.seatCount} seats vs available capacity. If sufficient, Total Cost is confirmed and case routes to Stage 3 Customer Approval Checkpoint.
            </p>

            <div className="action-controls-row">
              {show?.seatsRemaining >= selectedCase.seatCount ? (
                <button 
                  type="button" 
                  className="btn-primary-action"
                  onClick={() => runAvailabilityCheck(selectedCase.caseId, 'Staff Ops Agent')}
                >
                  Verify Capacity & Advance to Approval
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--danger-red)', fontSize: '12px', fontWeight: '600' }}>
                    Capacity Deficit ({selectedCase.seatCount - (show?.seatsRemaining || 0)} seats short)
                  </span>
                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    onClick={() => setAltShowModal(true)}
                  >
                    Suggest Alternate Shows
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {selectedCase.stage?.includes('Approval') && selectedCase.status === STATUSES.PENDING_APPROVAL && (
          <>
            <div className="action-box-header">
              <div className="action-box-title">
                <span>Stage 3 Approval — Customer Confirmation Checkpoint</span>
              </div>
              <span className="tab-badge" style={{ color: 'var(--amber-500)', borderColor: 'var(--amber-500)' }}>
                Awaiting Explicit Confirmation
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Seats are verified. Customer confirmation is required to lock seats and generate tickets. Ops can confirm on behalf of customer or open the customer-facing confirmation screen.
            </p>

            <div className="action-controls-row">
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => confirmBooking(selectedCase.caseId, 'Staff Agent (Customer Authorized)')}
              >
                Confirm & Execute Booking (${selectedCase.totalCost?.toFixed(2)})
              </button>

              <button 
                type="button" 
                className="btn-secondary-action"
                onClick={() => {
                  setCustomerActiveCaseId(selectedCase.caseId);
                  setActiveRole('customer');
                }}
              >
                Open in Customer Checkpoint View ↗
              </button>

              <button 
                type="button" 
                className="btn-cancel-action"
                onClick={() => {
                  const reason = window.prompt('Enter cancellation reason:', 'Customer requested cancellation at approval checkpoint');
                  if (reason) cancelBooking(selectedCase.caseId, reason, 'Staff Agent');
                }}
              >
                Cancel Request
              </button>
            </div>
          </>
        )}

        {selectedCase.status === STATUSES.RESOLVED_CONFIRMED && (
          <>
            <div className="action-box-header">
              <div className="action-box-title" style={{ color: 'var(--emerald-500)' }}>
                <span>Stage 4 Booking Execution — Resolved & Confirmed</span>
              </div>
              <span className="tab-badge" style={{ color: 'var(--emerald-500)', borderColor: 'var(--emerald-border)' }}>
                Ref: {selectedCase.bookingReference}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Booking is executed. Seats are locked and decremented from show capacity. Confirmation correspondence dispatched to {selectedCase.customerEmail}.
            </p>

            <div className="action-controls-row">
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => setShowTicketModal(true)}
              >
                <IconTicketStub size={14} />
                View & Print Ticket Voucher
              </button>
            </div>
          </>
        )}

        {selectedCase.status === STATUSES.RESOLVED_CANCELLED && (
          <>
            <div className="action-box-header">
              <div className="action-box-title" style={{ color: 'var(--text-muted)' }}>
                <span>Case Lifecycle Terminated — Resolved-Cancelled</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              This booking request was cancelled. No seats were decremented and no confirmation correspondence was dispatched.
            </p>
          </>
        )}
      </div>

      {/* 6. Referenced Data Entities (Movie & Show) */}
      <div className="entities-grid">
        {/* Movie Object */}
        <div className="entity-card">
          <div className="entity-card-header">
            <span>Referenced Movie</span>
            <span className="movie-card-badge">{movie?.certificate || 'PG-13'}</span>
          </div>

          <div className="entity-name">{movie?.title || 'Unknown Title'}</div>
          
          <div className="entity-meta-list">
            <div><strong>Genre:</strong> {movie?.genre}</div>
            <div><strong>Language:</strong> {movie?.language} • <strong>Runtime:</strong> {movie?.durationMinutes} mins</div>
            <div><strong>Rating:</strong> ★ {movie?.ratingScore} / 10</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
              "{movie?.synopsis}"
            </div>
          </div>
        </div>

        {/* Show Object */}
        <div className="entity-card">
          <div className="entity-card-header">
            <span>Referenced Show ({show?.id})</span>
            <span className={`queue-badge ${show?.showType === 'Premium' ? 'queue-premium' : 'queue-standard'}`}>
              {show?.showType}
            </span>
          </div>

          <div className="entity-name">{show?.theatre}</div>

          <div className="entity-meta-list">
            <div><strong>Screen:</strong> {show?.screen}</div>
            <div><strong>Date & Time:</strong> {show?.date} at {show?.time}</div>
            <div><strong>Base Seat Price:</strong> ${show?.basePrice?.toFixed(2)}</div>
            
            <div className="capacity-meter">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Remaining Capacity</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {show?.seatsRemaining} / {show?.totalCapacity} seats
                </span>
              </div>
              <div className="capacity-bar-track">
                <div 
                  className="capacity-bar-fill" 
                  style={{ width: `${show ? (show.seatsRemaining / show.totalCapacity) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Live Cost Calculation Breakdown */}
      <div className="cost-breakdown-card">
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
          Calculated Total Cost Breakdown (Read-Only Property)
        </div>

        <div className="cost-row">
          <span>Show Base Rate:</span>
          <span className="cost-val">${show?.basePrice?.toFixed(2)}</span>
        </div>

        <div className="cost-row">
          <span>Seat Category: {categoryConfig.label} ({categoryConfig.multiplier}x):</span>
          <span className="cost-val">${((show?.basePrice || 15) * categoryConfig.multiplier).toFixed(2)} / seat</span>
        </div>

        <div className="cost-row">
          <span>Seat Quantity ({selectedCase.seatCount} seats):</span>
          <span className="cost-val">
            ${(((show?.basePrice || 15) * categoryConfig.multiplier) * selectedCase.seatCount).toFixed(2)}
          </span>
        </div>

        <div className="cost-row">
          <span>Digital Ticketing & Facility Fee ($2.50 / seat):</span>
          <span className="cost-val">${(2.50 * selectedCase.seatCount).toFixed(2)}</span>
        </div>

        <div className="cost-row total-row">
          <span>TOTAL COST (Calculated):</span>
          <span className="total-val">${selectedCase.totalCost?.toFixed(2)}</span>
        </div>
      </div>

      {/* 8. Audit Trail / Case Timeline (Hero UI Element) */}
      <div className="audit-trail-card">
        <div className="audit-trail-title">
          <IconAudit size={14} />
          <span>Case Timeline & Audit Trail ({selectedCase.stageHistory?.length || 0} events)</span>
        </div>

        <div className="timeline-list">
          {selectedCase.stageHistory?.map((event, idx) => (
            <div key={idx} className="timeline-event">
              <div className="timeline-dot" />
              <div className="timeline-event-header">
                <span className="timeline-action">{event.action}</span>
                <span className="timeline-time">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <div className="timeline-actor">Actor: {event.actor} • Stage: {event.stage}</div>
              <div className="timeline-notes">{event.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Correspondence Log */}
      <div className="correspondence-box">
        <div className="correspondence-header">
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconMail size={13} />
            <span>Correspondence Records ({selectedCase.correspondenceLog?.length || 0})</span>
          </div>
        </div>

        {selectedCase.correspondenceLog?.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            No correspondence dispatched yet. Triggered automatically on Stage 4 Booking Execution.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedCase.correspondenceLog.map((corr, idx) => (
              <div key={idx} className="correspondence-item">
                <div className="corr-subject">{corr.subject}</div>
                <div className="corr-meta">
                  <span>To: {corr.recipient} ({corr.deliveryStatus})</span>
                  <span>{new Date(corr.timestamp).toLocaleString()}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-secondary-action" 
                  style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setSelectedCorrModal(corr)}
                >
                  View Correspondence Body
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Correspondence Body Modal */}
      {selectedCorrModal && (
        <div className="modal-backdrop" onClick={() => setSelectedCorrModal(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Correspondence Record: {selectedCorrModal.id}</div>
              <button type="button" className="btn-secondary-action" onClick={() => setSelectedCorrModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <div><strong>Recipient:</strong> {selectedCorrModal.recipient}</div>
                <div><strong>Subject:</strong> {selectedCorrModal.subject}</div>
                <div><strong>Sent:</strong> {new Date(selectedCorrModal.timestamp).toLocaleString()}</div>
                <div><strong>Status:</strong> {selectedCorrModal.deliveryStatus}</div>
              </div>
              <pre style={{ 
                background: 'var(--bg-inset)', 
                color: 'var(--text-primary)', 
                padding: '12px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
                border: '1px solid var(--border-default)'
              }}>
                {selectedCorrModal.body}
              </pre>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary-action" onClick={() => setSelectedCorrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Voucher Modal */}
      {showTicketModal && (
        <TicketStubModal 
          caseItem={selectedCase} 
          show={show} 
          movie={movie} 
          onClose={() => setShowTicketModal(false)} 
        />
      )}
    </div>
  );
}
