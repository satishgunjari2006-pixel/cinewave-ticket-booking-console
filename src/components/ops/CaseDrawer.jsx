import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { STAGES, STATUSES, QUEUES, SEAT_CATEGORIES, FOOD_BEVERAGE_MENU } from '../../data/types';
import { formatINR, calculateRefundAmount } from '../../utils/costCalculator';
import { IconFilmReel, IconSeat, IconTicketStub, IconAudit, IconMail, IconSLAClock } from '../common/Icons';
import { TicketStubModal } from '../customer/TicketStubModal';
import { WhatsAppPreviewModal } from '../customer/WhatsAppPreviewModal';

export function CaseDrawer({ caseItem, onClose }) {
  const { 
    shows,
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

  const [selectedCorrModal, setSelectedCorrModal] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleShowId, setRescheduleShowId] = useState('');

  if (!caseItem) return null;

  const { movie, show } = getCaseEntities(caseItem);
  const categoryConfig = SEAT_CATEGORIES[caseItem.seatCategory] || SEAT_CATEGORIES.STANDARD;

  let currentStageIdx = 0;
  if (caseItem.stage?.includes('Availability') || caseItem.stage === 'AVAILABILITY') currentStageIdx = 1;
  if (caseItem.stage?.includes('Approval') || caseItem.stage === 'APPROVAL') currentStageIdx = 2;
  if (caseItem.stage?.includes('Execution') || caseItem.stage === 'EXECUTION' || caseItem.status === STATUSES.RESOLVED_CONFIRMED) currentStageIdx = 3;

  const isResolved = caseItem.status === STATUSES.RESOLVED_CONFIRMED || caseItem.status === STATUSES.RESOLVED_CANCELLED || caseItem.status === STATUSES.RESOLVED_REFUNDED;

  // Alternate shows for rescheduling (same movie)
  const alternateShows = shows.filter(s => s.movieId === show?.movieId && s.id !== show?.id && s.seatsRemaining >= caseItem.seatCount);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel" onClick={e => e.stopPropagation()} aria-label="Case Inspector">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-title-row">
              <h2 className="drawer-case-id">{caseItem.caseId}</h2>
              <StatusBadge status={caseItem.status} />
              <QueueBadge queue={caseItem.queue} />
            </div>
            <div className="drawer-created-time">
              Intake Created: {new Date(caseItem.createdAt).toLocaleString()} • Txn: <span className="font-mono">{caseItem.paymentTxnId || 'CW-TXN-OK'}</span>
            </div>
          </div>

          <div className="drawer-header-actions">
            {!isResolved && (
              <select
                className="filter-select"
                value={caseItem.queue}
                onChange={(e) => reassignQueue(caseItem.caseId, e.target.value)}
                title="Reassign Queue"
              >
                <option value={QUEUES.STANDARD}>Standard Queue</option>
                <option value={QUEUES.PREMIUM}>Premium Queue</option>
              </select>
            )}

            <button type="button" className="btn-close-drawer" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* 1. SLA Urgency Monitor */}
          <SLABadge caseItem={caseItem} simulatedNow={simulatedNow} variant="detailed" />

          {/* 2. 4-Stage Stepper */}
          <div className="stage-tracker-wrapper">
            <div className="stage-tracker-title">Case Lifecycle Progress</div>
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
                <div className="stage-step-dot">{caseItem.status === STATUSES.RESOLVED_CONFIRMED ? '✓' : '4'}</div>
                <div className="stage-step-label">4. Execution</div>
              </div>
            </div>
          </div>

          {/* 3. Stage Action Workspace */}
          <div className="stage-action-box">
            {caseItem.stage?.includes('Intake') && caseItem.status === STATUSES.NEW && (
              <>
                <div className="action-box-header">
                  <div className="action-box-title">
                    <span>Stage 1 Intake — Capacity Check Required</span>
                  </div>
                  <span className="tab-badge">{caseItem.queue}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Booking request received for {caseItem.seatCount} {categoryConfig.label} seat(s). Verify inventory availability against Show {caseItem.showId} at {show?.theatre} ({show?.city}).
                </p>
                <div className="action-controls-row">
                  <button 
                    type="button" 
                    className="btn-primary-action"
                    onClick={() => runAvailabilityCheck(caseItem.caseId, 'Staff Ops Agent')}
                  >
                    Run Availability Check → Advance to Approval
                  </button>
                </div>
              </>
            )}

            {caseItem.stage?.includes('Availability') && (
              <>
                <div className="action-box-header">
                  <div className="action-box-title">
                    <span>Stage 2 Availability — Seat Inventory Verification</span>
                  </div>
                  <span style={{ fontSize: '12px', color: show?.seatsRemaining >= caseItem.seatCount ? 'var(--emerald-500)' : 'var(--danger-red)', fontWeight: '700' }}>
                    {show?.seatsRemaining} seats remaining (Requested: {caseItem.seatCount})
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  System checks requested {caseItem.seatCount} seats vs available capacity. If sufficient, Total Cost is locked in INR and case routes to Stage 3 Customer Approval Checkpoint.
                </p>

                <div className="action-controls-row">
                  <button 
                    type="button" 
                    className="btn-primary-action"
                    onClick={() => runAvailabilityCheck(caseItem.caseId, 'Staff Ops Agent')}
                  >
                    Verify Capacity & Advance to Approval
                  </button>
                </div>
              </>
            )}

            {caseItem.stage?.includes('Approval') && caseItem.status === STATUSES.PENDING_APPROVAL && (
              <>
                <div className="action-box-header">
                  <div className="action-box-title">
                    <span>Stage 3 Approval — Customer Confirmation Checkpoint</span>
                  </div>
                  <span className="tab-badge" style={{ color: 'var(--amber-500)', borderColor: 'var(--amber-500)' }}>
                    Awaiting Explicit Customer Confirmation
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Seats are verified. Customer confirmation is required to lock seats and generate tickets. Ops can confirm on behalf of customer or open the customer-facing confirmation screen.
                </p>

                <div className="action-controls-row">
                  <button 
                    type="button" 
                    className="btn-primary-action"
                    onClick={() => confirmBooking(caseItem.caseId, 'Staff Agent (Customer Authorized)')}
                  >
                    Confirm & Execute Booking ({formatINR(caseItem.totalCost)})
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    onClick={() => {
                      setCustomerActiveCaseId(caseItem.caseId);
                      setActiveRole('customer');
                      onClose();
                    }}
                  >
                    Open in Customer Checkpoint View ↗
                  </button>

                  <button 
                    type="button" 
                    className="btn-cancel-action"
                    onClick={() => {
                      const reason = window.prompt('Enter cancellation reason:', 'Customer requested cancellation at approval checkpoint');
                      if (reason) cancelBooking(caseItem.caseId, reason, 'Staff Agent');
                    }}
                  >
                    Cancel Request
                  </button>
                </div>
              </>
            )}

            {caseItem.status === STATUSES.RESOLVED_CONFIRMED && (
              <>
                <div className="action-box-header">
                  <div className="action-box-title" style={{ color: 'var(--emerald-500)' }}>
                    <span>Stage 4 Booking Execution — Resolved & Confirmed</span>
                  </div>
                  <span className="tab-badge" style={{ color: 'var(--emerald-500)', borderColor: 'var(--emerald-border)' }}>
                    Ref: {caseItem.bookingReference}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Booking is executed. Seats are locked and decremented from show capacity. Confirmation correspondence dispatched to {caseItem.customerEmail}.
                </p>

                <div className="action-controls-row">
                  <button 
                    type="button" 
                    className="btn-primary-action"
                    onClick={() => setShowTicketModal(true)}
                  >
                    <IconTicketStub size={16} />
                    View & Print Ticket Voucher
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    style={{ background: '#25D366', color: '#000', fontWeight: '700', borderColor: 'transparent' }}
                    onClick={() => setShowWhatsAppModal(true)}
                  >
                    📲 WhatsApp Pass
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-action"
                    onClick={() => setShowRescheduleModal(true)}
                  >
                    🔄 Reschedule Showtime
                  </button>

                  <button 
                    type="button" 
                    className="btn-cancel-action"
                    onClick={() => {
                      if (window.confirm(`Issue cancellation & process refund for ${caseItem.customerName}? Seats will be restored to inventory.`)) {
                        processRefund(caseItem.caseId, 'Ops agent processed customer refund', 'Staff Ops Agent');
                      }
                    }}
                  >
                    Issue Refund
                  </button>
                </div>
              </>
            )}

            {caseItem.status === STATUSES.RESOLVED_REFUNDED && (
              <>
                <div className="action-box-header">
                  <div className="action-box-title" style={{ color: 'var(--amber-500)' }}>
                    <span>Resolved-Refunded</span>
                  </div>
                  <span className="tab-badge" style={{ color: 'var(--amber-500)' }}>
                    Refund: {formatINR(caseItem.refundAmount || caseItem.totalCost)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  This booking was cancelled and refunded. Seats have been returned to show capacity.
                </p>
              </>
            )}

            {caseItem.status === STATUSES.RESOLVED_CANCELLED && (
              <>
                <div className="action-box-header">
                  <div className="action-box-title" style={{ color: 'var(--text-muted)' }}>
                    <span>Case Lifecycle Terminated — Resolved-Cancelled</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  This booking request was cancelled. No seats were decremented.
                </p>
              </>
            )}
          </div>

          {/* 4. Customer Info Strip */}
          <div className="drawer-section">
            <div className="section-mini-title">Guest Contact & Payment Details</div>
            <div className="guest-info-grid">
              <div>
                <span className="label-dim">Full Name</span>
                <div className="val-bold">{caseItem.customerName}</div>
              </div>
              <div>
                <span className="label-dim">Email</span>
                <div className="val-bold font-mono">{caseItem.customerEmail}</div>
              </div>
              <div>
                <span className="label-dim">Payment Mode</span>
                <div className="val-bold">{caseItem.paymentMethod || 'UPI Instant'}</div>
              </div>
            </div>
          </div>

          {/* 5. Referenced Entities */}
          <div className="entities-grid">
            <div className="entity-card">
              <div className="entity-card-header">
                <span>Referenced Movie</span>
                <span className="movie-card-badge">{movie?.certificate}</span>
              </div>
              <div className="entity-name">{movie?.title}</div>
              <div className="entity-meta-list">
                <div><strong>Genre:</strong> {movie?.genre}</div>
                <div><strong>Runtime:</strong> {movie?.durationMinutes} mins • ★ {movie?.ratingScore}</div>
              </div>
            </div>

            <div className="entity-card">
              <div className="entity-card-header">
                <span>Referenced Show ({show?.id})</span>
                <span className={`queue-badge ${show?.showType === 'Premium' ? 'queue-premium' : 'queue-standard'}`}>
                  {show?.showType}
                </span>
              </div>
              <div className="entity-name">{show?.theatre}</div>
              <div className="entity-meta-list">
                <div><strong>Location:</strong> {show?.city}, {show?.state}</div>
                <div><strong>Screen:</strong> {show?.screen} ({show?.format || '2D'})</div>
                <div><strong>Showtime:</strong> {show?.date} at {show?.time}</div>
                <div><strong>Capacity:</strong> {show?.seatsRemaining} / {show?.totalCapacity} seats remaining</div>
              </div>
            </div>
          </div>

          {/* 6. Live Cost Calculation Breakdown in INR */}
          <div className="cost-breakdown-card">
            <div className="section-mini-title">Calculated Total Cost Breakdown (INR)</div>
            <div className="cost-row">
              <span>Show Base Rate:</span>
              <span className="cost-val">{formatINR(show?.basePrice || 250, false)}</span>
            </div>
            <div className="cost-row">
              <span>Seat Tier: {categoryConfig.label} ({categoryConfig.multiplier}x):</span>
              <span className="cost-val">{formatINR(Math.round((show?.basePrice || 250) * categoryConfig.multiplier), false)} / seat</span>
            </div>
            <div className="cost-row">
              <span>Seat Quantity ({caseItem.seatCount} seats: {caseItem.selectedSeats?.join(', ')}):</span>
              <span className="cost-val">{formatINR(Math.round((show?.basePrice || 250) * categoryConfig.multiplier) * caseItem.seatCount)}</span>
            </div>
            <div className="cost-row">
              <span>Convenience Fee & GST (18%):</span>
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

              <div className="form-group">
                <label className="form-label">Available Alternate Screenings</label>
                <select 
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
            <div className="modal-footer">
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
