import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { STAGES, STATUSES, QUEUES, SEAT_CATEGORIES, FOOD_BEVERAGE_MENU } from '../../data/types';
import { formatINR, calculateRefundAmount } from '../../utils/costCalculator';
import { IconTicketStub, IconAudit, IconMail, IconSLAClock, IconAlertCircle } from '../common/Icons';
import { TicketStubModal } from '../customer/TicketStubModal';
import { WhatsAppPreviewModal } from '../customer/WhatsAppPreviewModal';

export function CaseDrawer({ caseItem, onClose }) {
  const { 
    shows, 
    movies, 
    getCaseEntities, 
    simulatedNow, 
    runAvailabilityCheck, 
    confirmBooking, 
    cancelBooking,
    processRefund,
    rescheduleBooking,
    reassignQueue,
    setActiveRole,
    setCustomerActiveCaseId,
  } = useCaseContext();

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleShowId, setRescheduleShowId] = useState('');
  const [selectedCorrModal, setSelectedCorrModal] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [customRefundReason, setCustomRefundReason] = useState('');
  const [showRefundInput, setShowRefundInput] = useState(false);

  if (!caseItem) return null;

  const { movie, show } = getCaseEntities(caseItem);
  const categoryConfig = SEAT_CATEGORIES[caseItem.seatCategory] || SEAT_CATEGORIES.STANDARD;

  // Determine stage progression index (0: Initial Stage, 1: Availability, 2: Approval, 3: Booking Execution)
  let currentStageIdx = 0;
  if (caseItem.stage === STAGES.AVAILABILITY || caseItem.stage?.includes('Availability')) currentStageIdx = 1;
  if (caseItem.stage === STAGES.APPROVAL || caseItem.stage?.includes('Approval')) currentStageIdx = 2;
  if (caseItem.stage === STAGES.EXECUTION || caseItem.stage?.includes('Execution') || caseItem.status === STATUSES.RESOLVED_CONFIRMED) currentStageIdx = 3;

  const isResolved = caseItem.status === STATUSES.RESOLVED_CONFIRMED || caseItem.status === STATUSES.RESOLVED_CANCELLED || caseItem.status === STATUSES.RESOLVED_REFUNDED;
  const isConfirmed = caseItem.status === STATUSES.RESOLVED_CONFIRMED;
  const isRefunded = caseItem.status === STATUSES.RESOLVED_REFUNDED;
  const isCancelled = caseItem.status === STATUSES.RESOLVED_CANCELLED;

  const alternateShows = shows.filter(
    s => s.movieId === show?.movieId && s.city === show?.city && s.id !== show?.id && s.seatsRemaining >= caseItem.seatCount
  );

  const showDateTime = show && show.date && show.time ? new Date(`${show.date}T${show.time}`) : null;
  const hoursRemaining = showDateTime && !isNaN(showDateTime.getTime()) 
    ? Math.max(0, (showDateTime.getTime() - simulatedNow) / (1000 * 60 * 60)) 
    : 24;
  const refundCalc = show ? calculateRefundAmount(caseItem.totalCost, hoursRemaining) : null;

  const handleOpenCustomerView = () => {
    setCustomerActiveCaseId(caseItem.caseId);
    setActiveRole('customer');
  };

  const handleProcessRefundClick = () => {
    if (!showRefundInput) {
      setShowRefundInput(true);
      return;
    }
    const res = processRefund(caseItem.caseId, 'Staff Ops Dispatcher', customRefundReason);
    if (res.success) {
      setShowRefundInput(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-row">
            <div className="case-id-prominent">
              <span>{caseItem.caseId}</span>
              <StatusBadge status={caseItem.status} />
            </div>
            <button type="button" className="drawer-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="drawer-meta-row">
            <QueueBadge queue={caseItem.queue} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Created: {new Date(caseItem.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="drawer-body">
          {/* 1. SLA Urgency Status */}
          <SLABadge caseItem={caseItem} simulatedNow={simulatedNow} variant="detailed" />

          {/* 2. 4-Stage Lifecycle Stepper */}
          <div className="stage-tracker-wrapper" style={{ margin: '14px 0' }}>
            <div className="stage-tracker-title">Case Lifecycle Progress</div>
            <div className="stage-steps-row">
              <div className={`stage-step-item ${currentStageIdx >= 0 ? (currentStageIdx > 0 ? 'stage-step-completed' : 'stage-step-active') : 'stage-step-upcoming'}`}>
                <div className="stage-step-circle">{currentStageIdx > 0 ? '✓' : '1'}</div>
                <div className="stage-step-meta">
                  <span className="stage-step-name">Initial Stage</span>
                  <span className="stage-step-desc">Intake & routing</span>
                </div>
              </div>

              <div className={`stage-step-item ${currentStageIdx >= 1 ? (currentStageIdx > 1 ? 'stage-step-completed' : 'stage-step-active') : 'stage-step-upcoming'}`}>
                <div className="stage-step-circle">{currentStageIdx > 1 ? '✓' : '2'}</div>
                <div className="stage-step-meta">
                  <span className="stage-step-name">Availability</span>
                  <span className="stage-step-desc">Screen capacity</span>
                </div>
              </div>

              <div className={`stage-step-item ${currentStageIdx >= 2 ? (currentStageIdx > 2 ? 'stage-step-completed' : 'stage-step-active') : 'stage-step-upcoming'}`}>
                <div className="stage-step-circle">{currentStageIdx > 2 ? '✓' : '3'}</div>
                <div className="stage-step-meta">
                  <span className="stage-step-name">Approval</span>
                  <span className="stage-step-desc">Confirmation checkpoint</span>
                </div>
              </div>

              <div className={`stage-step-item ${currentStageIdx >= 3 ? 'stage-step-completed' : 'stage-step-upcoming'}`}>
                <div className="stage-step-circle">{isConfirmed ? '✓' : '4'}</div>
                <div className="stage-step-meta">
                  <span className="stage-step-name">Booking Execution</span>
                  <span className="stage-step-desc">Locked & issued</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Action Workspace Toolbar */}
          <div className="drawer-actions-box" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px', margin: '14px 0' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>
              Operational Actions & Queue Routing
            </div>

            {/* Queue Reassignment */}
            {!isResolved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reassign Queue:</span>
                <select
                  className="filter-select"
                  style={{ flex: 1 }}
                  value={caseItem.queue}
                  onChange={(e) => reassignQueue(caseItem.caseId, e.target.value)}
                >
                  <option value={QUEUES.STANDARD}>Standard ShowQueue</option>
                  <option value={QUEUES.PREMIUM}>Premium ShowQueue</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {caseItem.stage === STAGES.INITIAL && caseItem.status === STATUSES.NEW && (
                <button 
                  type="button" 
                  className="btn-primary-action"
                  onClick={() => runAvailabilityCheck(caseItem.caseId)}
                >
                  Run Capacity Check (Stage 2)
                </button>
              )}

              {(caseItem.stage === STAGES.AVAILABILITY || caseItem.status === STATUSES.PENDING_AVAILABILITY) && (
                <button 
                  type="button" 
                  className="btn-primary-action"
                  onClick={() => runAvailabilityCheck(caseItem.caseId)}
                >
                  Re-verify Screen Capacity
                </button>
              )}

              {(caseItem.stage === STAGES.APPROVAL && caseItem.status === STATUSES.PENDING_APPROVAL) && (
                <>
                  <button 
                    type="button" 
                    className="btn-primary-action"
                    style={{ background: '#10B981', borderColor: '#10B981' }}
                    onClick={() => confirmBooking(caseItem.caseId, 'Operator Override')}
                  >
                    ✓ Confirm & Execute (Stage 4)
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    onClick={handleOpenCustomerView}
                  >
                    Open Customer Checkpoint
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    onClick={() => cancelBooking(caseItem.caseId, 'Cancelled by operator at Approval checkpoint', 'Staff Operator')}
                  >
                    ✕ Cancel Request
                  </button>
                </>
              )}

              {isConfirmed && (
                <>
                  <button 
                    type="button"
                    className="btn-view-pass"
                    style={{ background: '#E50914', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setShowTicketModal(true)}
                  >
                    <IconTicketStub size={15} />
                    View Ticket Pass
                  </button>

                  <button 
                    type="button"
                    className="btn-secondary-action"
                    style={{ background: '#25D366', color: '#000', fontWeight: '700', borderColor: 'transparent', padding: '6px 12px', borderRadius: '4px' }}
                    onClick={() => setShowWhatsAppModal(true)}
                  >
                    📱 WhatsApp
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    onClick={() => setShowRescheduleModal(true)}
                  >
                    Reschedule Show
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    style={{ color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={handleProcessRefundClick}
                  >
                    Cancel with Refund
                  </button>
                </>
              )}
            </div>

            {/* Custom Refund Reason Box */}
            {showRefundInput && isConfirmed && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                  Refund Preview: {formatINR(refundCalc?.refundAmount || 0)} ({refundCalc?.policyTierLabel})
                </div>
                <input 
                  type="text" 
                  placeholder="Optional custom refund note..."
                  className="search-input"
                  style={{ width: '100%', marginBottom: '8px' }}
                  value={customRefundReason}
                  onChange={e => setCustomRefundReason(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-primary-action" style={{ background: '#EF4444', borderColor: '#EF4444' }} onClick={handleProcessRefundClick}>
                    Authorize & Disconnect Seats
                  </button>
                  <button type="button" className="btn-secondary-action" onClick={() => setShowRefundInput(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Guest Contact Strip */}
          <div className="drawer-section-card">
            <div className="section-title-mini">Guest Contact Information</div>
            <div className="details-key-val-grid">
              <div><span className="text-muted">Full Name:</span> <strong>{caseItem.customerName}</strong></div>
              <div><span className="text-muted">Email:</span> <strong>{caseItem.customerEmail}</strong></div>
              <div><span className="text-muted">Phone:</span> <strong>{caseItem.customerPhone}</strong></div>
              <div><span className="text-muted">Payment:</span> <strong>{caseItem.paymentMethod} ({caseItem.paymentTxnId})</strong></div>
            </div>
          </div>

          {/* 5. Feature & Theatre Booking Object */}
          <div className="drawer-section-card">
            <div className="section-title-mini">Feature & Screening Auditorium</div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {movie?.posterUrl && (
                <img src={movie.posterUrl} alt={movie.title} style={{ width: '56px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>{movie?.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{movie?.genre} • {movie?.certificate}</div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <strong>{show?.theatre}</strong> ({show?.city}, {show?.state})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--amber-400)', fontWeight: '600' }}>
                  {show?.screen} ({show?.format}) • {show?.date} at {show?.time}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Pricing & Cost Breakdown */}
          <div className="cost-breakdown-card">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
              Calculated Cost Breakdown
            </div>

            <div className="cost-row">
              <span>Seats Selected ({caseItem.seatCount}x):</span>
              <span className="cost-val">{caseItem.selectedSeats?.join(', ')} ({categoryConfig.label})</span>
            </div>

            <div className="cost-row">
              <span>Tickets Base Rate:</span>
              <span className="cost-val">{formatINR(((show?.basePrice || 250) * categoryConfig.multiplier) * caseItem.seatCount)}</span>
            </div>

            <div className="cost-row">
              <span>Convenience Fee & GST:</span>
              <span className="cost-val">{formatINR(35.40 * caseItem.seatCount)}</span>
            </div>

            {Array.isArray(caseItem.foodItems) && caseItem.foodItems.length > 0 && (
              <div className="cost-row" style={{ color: 'var(--amber-500)' }}>
                <span>🍿 F&B Snacks ({caseItem.foodItems.length} items):</span>
                <span className="cost-val">
                  {formatINR(caseItem.foodItems.reduce((acc, f) => {
                    const menu = FOOD_BEVERAGE_MENU.find(m => m.id === f.id);
                    return acc + (menu ? menu.price * f.quantity : 0);
                  }, 0))}
                </span>
              </div>
            )}

            <div className="cost-row total-row">
              <span>TOTAL COST (INR):</span>
              <span className="total-val">{formatINR(caseItem.totalCost)}</span>
            </div>
          </div>

          {/* 7. Audit Trail */}
          <div className="audit-trail-card">
            <div className="audit-trail-title">
              <IconAudit size={16} />
              <span>Case Timeline & Audit Trail ({caseItem.stageHistory?.length || 0} events)</span>
            </div>

            <div className="timeline-list">
              {caseItem.stageHistory?.map((event, idx) => (
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

          {/* 8. Correspondence Log */}
          <div className="correspondence-box">
            <div className="correspondence-header">
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMail size={14} />
                <span>Correspondence Records ({caseItem.correspondenceLog?.length || 0})</span>
              </div>
            </div>

            {caseItem.correspondenceLog?.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                No correspondence dispatched yet. Dispatched automatically upon Stage 4 Booking Execution.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {caseItem.correspondenceLog.map((corr, idx) => (
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
                      View Dispatched Email Body
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="modal-backdrop" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Reschedule Showtime for {caseItem.caseId}</div>
              <button type="button" className="btn-secondary-action" onClick={() => setShowRescheduleModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Select an alternate scheduled screening for <strong>{movie?.title}</strong> in {show?.city}:
              </p>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Available Alternate Screenings</label>
                <select 
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={rescheduleShowId} 
                  onChange={e => setRescheduleShowId(e.target.value)}
                >
                  <option value="">-- Choose Alternate Show --</option>
                  {alternateShows.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.theatre} — {s.screen} ({s.date} at {s.time}) • {s.seatsRemaining} seats left
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary-action" onClick={() => setShowRescheduleModal(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn-primary-action"
                disabled={!rescheduleShowId}
                onClick={() => {
                  rescheduleBooking(caseItem.caseId, rescheduleShowId);
                  setShowRescheduleModal(false);
                }}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correspondence Modal */}
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

      {/* Ticket Pass Modal */}
      {showTicketModal && (
        <TicketStubModal 
          caseItem={caseItem} 
          show={show} 
          movie={movie} 
          onClose={() => setShowTicketModal(false)} 
        />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <WhatsAppPreviewModal
          caseItem={caseItem}
          show={show}
          movie={movie}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
}
