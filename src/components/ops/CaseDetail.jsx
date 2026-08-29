import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { STAGES, STATUSES, QUEUES, SEAT_CATEGORIES } from '../../data/types';
import { formatINR } from '../../utils/costCalculator';
import { IconFilmReel, IconSeat, IconTicketStub, IconAudit, IconMail, IconSLAClock, IconAlertCircle } from '../common/Icons';
import { TicketStubModal } from '../customer/TicketStubModal';

export function CaseDetail() {
  const { 
    selectedCase, 
    getCaseEntities, 
    simulatedNow, 
    runAvailabilityCheck, 
    confirmBooking, 
    cancelBooking,
    reassignQueue,
    setActiveRole,
    setCustomerActiveCaseId,
  } = useCaseContext();

  const [selectedCorrModal, setSelectedCorrModal] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  if (!selectedCase) {
    return (
      <div className="case-inspector-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '15px', fontWeight: '600' }}>Select a case from the queue table to view case lifecycle details</p>
      </div>
    );
  }

  const { movie, show } = getCaseEntities(selectedCase);
  const categoryConfig = SEAT_CATEGORIES[selectedCase.seatCategory] || SEAT_CATEGORIES.STANDARD;

  // Determine stage progression index (0: Initial Stage, 1: Availability, 2: Approval, 3: Booking Execution)
  let currentStageIdx = 0;
  if (selectedCase.stage === STAGES.AVAILABILITY || selectedCase.stage?.includes('Availability')) currentStageIdx = 1;
  if (selectedCase.stage === STAGES.APPROVAL || selectedCase.stage?.includes('Approval')) currentStageIdx = 2;
  if (selectedCase.stage === STAGES.EXECUTION || selectedCase.stage?.includes('Execution') || selectedCase.status === STATUSES.RESOLVED_CONFIRMED) currentStageIdx = 3;

  const isResolved = selectedCase.status === STATUSES.RESOLVED_CONFIRMED || selectedCase.status === STATUSES.RESOLVED_CANCELLED || selectedCase.status === STATUSES.RESOLVED_REFUNDED;

  const handleOpenCustomerCheckpoint = () => {
    setCustomerActiveCaseId(selectedCase.caseId);
    setActiveRole('customer');
  };

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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route Queue:</span>
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
      <div className="customer-strip">
        <div><strong>Guest:</strong> {selectedCase.customerName}</div>
        <div><strong>Contact:</strong> {selectedCase.customerEmail} • {selectedCase.customerPhone}</div>
        <div><strong>Assigned Queue:</strong> <span style={{ color: selectedCase.queue?.includes('Premium') ? '#F59E0B' : '#60A5FA', fontWeight: '600' }}>{selectedCase.queue}</span></div>
      </div>

      {/* 3. SLA Monitor Block */}
      <div style={{ margin: '12px 0' }}>
        <SLABadge caseItem={selectedCase} simulatedNow={simulatedNow} variant="detailed" />
      </div>

      {/* 4. 4-Stage Lifecycle Stepper (Exact Names) */}
      <div className="stage-tracker-wrapper">
        <div className="stage-tracker-title">Case Lifecycle Stages</div>
        <div className="stage-steps-row">
          <div className={`stage-step-item ${currentStageIdx >= 0 ? (currentStageIdx > 0 ? 'stage-step-completed' : 'stage-step-active') : 'stage-step-upcoming'}`}>
            <div className="stage-step-circle">{currentStageIdx > 0 ? '✓' : '1'}</div>
            <div className="stage-step-meta">
              <span className="stage-step-name">Initial Stage</span>
              <span className="stage-step-desc">Case intake & routing</span>
            </div>
          </div>

          <div className={`stage-step-item ${currentStageIdx >= 1 ? (currentStageIdx > 1 ? 'stage-step-completed' : 'stage-step-active') : 'stage-step-upcoming'}`}>
            <div className="stage-step-circle">{currentStageIdx > 1 ? '✓' : '2'}</div>
            <div className="stage-step-meta">
              <span className="stage-step-name">Availability</span>
              <span className="stage-step-desc">Screen capacity check</span>
            </div>
          </div>

          <div className={`stage-step-item ${currentStageIdx >= 2 ? (currentStageIdx > 2 ? 'stage-step-completed' : 'stage-step-active') : 'stage-step-upcoming'}`}>
            <div className="stage-step-circle">{currentStageIdx > 2 ? '✓' : '3'}</div>
            <div className="stage-step-meta">
              <span className="stage-step-name">Approval</span>
              <span className="stage-step-desc">Customer confirmation</span>
            </div>
          </div>

          <div className={`stage-step-item ${currentStageIdx >= 3 ? 'stage-step-completed' : 'stage-step-upcoming'}`}>
            <div className="stage-step-circle">{selectedCase.status === STATUSES.RESOLVED_CONFIRMED ? '✓' : '4'}</div>
            <div className="stage-step-meta">
              <span className="stage-step-name">Booking Execution</span>
              <span className="stage-step-desc">Seats locked & ticket issued</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Stage Action Workspace */}
      <div className="stage-action-box" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', margin: '14px 0' }}>
        {selectedCase.stage === STAGES.INITIAL && selectedCase.status === STATUSES.NEW && (
          <>
            <div className="action-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>Stage 1: Initial Stage — Ready for Capacity Verification</div>
              <QueueBadge queue={selectedCase.queue} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Case has been received and routed to <strong>{selectedCase.queue}</strong>. Run the automated screen capacity check to advance to Stage 2: Availability.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => runAvailabilityCheck(selectedCase.caseId)}
              >
                Run Automated Capacity Verification
              </button>
            </div>
          </>
        )}

        {(selectedCase.stage === STAGES.AVAILABILITY || selectedCase.status === STATUSES.PENDING_AVAILABILITY) && (
          <>
            <div className="action-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', color: '#FBBF24', fontSize: '14px' }}>Stage 2: Availability Verification</div>
              <QueueBadge queue={selectedCase.queue} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Verify screen capacity ({show?.seatsRemaining} remaining of {show?.totalCapacity}). Once passed, the case advances to Stage 3: Approval for customer confirmation.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-primary-action"
                onClick={() => runAvailabilityCheck(selectedCase.caseId)}
              >
                Re-verify Availability
              </button>
            </div>
          </>
        )}

        {(selectedCase.stage === STAGES.APPROVAL && selectedCase.status === STATUSES.PENDING_APPROVAL) && (
          <>
            <div className="action-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', color: '#FBBF24', fontSize: '14px' }}>Stage 3: Approval — Customer Confirmation Checkpoint</div>
              <QueueBadge queue={selectedCase.queue} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Seats are verified. Case is awaiting customer confirmation at the Approval Checkpoint. Operator can also confirm on behalf of customer or open the customer view.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn-primary-action"
                style={{ background: '#10B981', borderColor: '#10B981' }}
                onClick={() => confirmBooking(selectedCase.caseId, 'Operator Override')}
              >
                ✓ Operator Confirm & Execute (Stage 4)
              </button>
              <button 
                type="button" 
                className="btn-secondary-action"
                onClick={handleOpenCustomerCheckpoint}
              >
                Open Customer Checkpoint View
              </button>
              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                onClick={() => cancelBooking(selectedCase.caseId, 'Cancelled by operator', 'Staff Operator')}
              >
                ✕ Cancel Booking Request
              </button>
            </div>
          </>
        )}

        {selectedCase.status === STATUSES.RESOLVED_CONFIRMED && (
          <>
            <div className="action-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', color: '#34D399', fontSize: '14px' }}>Stage 4: Booking Execution (Resolved-Confirmed)</div>
              <span className="tab-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>Ref: {selectedCase.bookingReference}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Auditorium seats locked and digital pass issued. Confirmation correspondence delivered to customer.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-view-pass"
                style={{ background: '#E50914', color: '#fff', padding: '6px 14px', borderRadius: '4px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowTicketModal(true)}
              >
                <IconTicketStub size={15} />
                View Customer Ticket Pass
              </button>
            </div>
          </>
        )}

        {selectedCase.status === STATUSES.RESOLVED_CANCELLED && (
          <div>
            <div style={{ fontWeight: '700', color: '#A1A1AA', fontSize: '14px' }}>Resolved-Cancelled</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>This request was cancelled without locking auditorium seat inventory.</p>
          </div>
        )}
      </div>

      {/* 6. Entity Data Preview Grid */}
      <div className="entity-preview-grid">
        {/* Movie Object */}
        <div className="entity-card">
          <div className="entity-card-header">
            <span>Referenced Feature ({movie?.id})</span>
            <span className="badge-cert">{movie?.certificate || 'UA'}</span>
          </div>

          <div className="entity-name">{movie?.title}</div>

          <div className="entity-meta-list">
            <div><strong>Genre:</strong> {movie?.genre}</div>
            <div><strong>Language:</strong> {movie?.language} • <strong>Runtime:</strong> {movie?.durationMinutes} mins</div>
            <div><strong>Rating:</strong> ⭐ {movie?.ratingScore} / 10</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
              "{movie?.synopsis}"
            </div>
          </div>
        </div>

        {/* Show Object */}
        <div className="entity-card">
          <div className="entity-card-header">
            <span>Referenced Show ({show?.id})</span>
            <QueueBadge queue={selectedCase.queue} />
          </div>

          <div className="entity-name">{show?.theatre}</div>

          <div className="entity-meta-list">
            <div><strong>Screen:</strong> {show?.screen} ({show?.format || 'Standard'})</div>
            <div><strong>Date & Time:</strong> {show?.date} at {show?.time}</div>
            <div><strong>Base Seat Price:</strong> {formatINR(show?.basePrice || 250)}</div>
            
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
          <span className="cost-val">{formatINR(show?.basePrice || 250)}</span>
        </div>

        <div className="cost-row">
          <span>Seat Category: {categoryConfig.label} ({categoryConfig.multiplier}x):</span>
          <span className="cost-val">{formatINR(((show?.basePrice || 250) * categoryConfig.multiplier))} / seat</span>
        </div>

        <div className="cost-row">
          <span>Seat Quantity ({selectedCase.seatCount} seats):</span>
          <span className="cost-val">
            {formatINR((((show?.basePrice || 250) * categoryConfig.multiplier) * selectedCase.seatCount))}
          </span>
        </div>

        <div className="cost-row">
          <span>Convenience Fee & Taxes (₹35.40 / seat):</span>
          <span className="cost-val">{formatINR(35.40 * selectedCase.seatCount)}</span>
        </div>

        <div className="cost-row total-row">
          <span>TOTAL COST (Calculated):</span>
          <span className="total-val">{formatINR(selectedCase.totalCost)}</span>
        </div>
      </div>

      {/* 8. Audit Trail / Case Timeline */}
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
            No correspondence dispatched yet. Dispatched automatically on Stage 4 Booking Execution.
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
                border: '1px solid var(--border-default)',
                marginTop: '10px'
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