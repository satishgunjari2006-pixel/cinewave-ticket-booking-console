import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { STATUSES, STAGES, SEAT_CATEGORIES } from '../../data/types';
import { formatINR, calculateRefundAmount } from '../../utils/costCalculator';
import { IconTicketStub, IconFilmReel, IconSeat, IconSLAClock, IconAlertCircle } from '../common/Icons';
import { TicketStubModal } from './TicketStubModal';
import { WhatsAppPreviewModal } from './WhatsAppPreviewModal';
import confetti from 'canvas-confetti';

export function ApprovalCheckpoint({ defaultCaseId }) {
  const { 
    cases, 
    getCaseEntities, 
    simulatedNow, 
    confirmBooking, 
    cancelBooking,
    processRefund,
  } = useCaseContext();

  const [inputCaseId, setInputCaseId] = useState(defaultCaseId || '');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const activeCase = cases.find(c => c.caseId.toLowerCase() === inputCaseId.trim().toLowerCase()) 
    || cases.find(c => c.caseId === defaultCaseId)
    || cases.find(c => c.stage === STAGES.APPROVAL && c.status === STATUSES.PENDING_APPROVAL)
    || cases.find(c => c.stage?.includes('Approval')) 
    || cases[0];

  const { movie, show } = getCaseEntities(activeCase);
  const categoryConfig = SEAT_CATEGORIES[activeCase?.seatCategory] || SEAT_CATEGORIES.STANDARD;

  const isAwaitingApproval = activeCase?.stage === STAGES.APPROVAL && activeCase?.status === STATUSES.PENDING_APPROVAL;
  const isConfirmed = activeCase?.status === STATUSES.RESOLVED_CONFIRMED || activeCase?.stage === STAGES.EXECUTION;
  const isCancelled = activeCase?.status === STATUSES.RESOLVED_CANCELLED;
  const isRefunded = activeCase?.status === STATUSES.RESOLVED_REFUNDED;

  // Determine stage progression index (0: Initial Stage, 1: Availability, 2: Approval, 3: Booking Execution)
  let currentStageIdx = 0;
  if (activeCase?.stage === STAGES.AVAILABILITY || activeCase?.stage?.includes('Availability')) currentStageIdx = 1;
  if (activeCase?.stage === STAGES.APPROVAL || activeCase?.stage?.includes('Approval')) currentStageIdx = 2;
  if (activeCase?.stage === STAGES.EXECUTION || activeCase?.stage?.includes('Execution') || isConfirmed) currentStageIdx = 3;

  const handleExplicitConfirm = () => {
    if (!activeCase) return;
    const res = confirmBooking(activeCase.caseId, `${activeCase.customerName} (Customer Checkpoint)`);
    if (res?.success) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
        });
      } catch {
        // Fallback if confetti not supported
      }
      setShowTicketModal(true);
    } else {
      alert(res?.message || 'Could not execute booking.');
    }
  };

  const handleExplicitCancel = () => {
    if (!activeCase) return;
    const confirmCancel = window.confirm(`Are you sure you want to cancel booking request ${activeCase.caseId}?`);
    if (confirmCancel) {
      cancelBooking(activeCase.caseId, 'Customer cancelled at Stage 3 Approval checkpoint', `${activeCase.customerName} (Customer Checkpoint)`);
    }
  };

  return (
    <div className="checkpoint-container">
      {/* 1. Quick Case Lookup Bar */}
      <div className="lookup-bar">
        <div>
          <h2 className="lookup-title">Approval Checkpoint & Case Tracker</h2>
          <p className="lookup-sub">
            Review your auditorium seats, total cost breakdown, and authorize or cancel reservation before execution.
          </p>
        </div>

        <div className="lookup-controls">
          <input 
            type="text" 
            placeholder="Enter Case ID (e.g. CW-REQ-1077)" 
            className="search-input"
            value={inputCaseId}
            onChange={e => setInputCaseId(e.target.value)}
          />
          <select 
            className="filter-select"
            value={activeCase?.caseId}
            onChange={e => setInputCaseId(e.target.value)}
          >
            {cases.map(c => (
              <option key={c.caseId} value={c.caseId}>
                {c.caseId} — {c.customerName} ({c.stage} • {c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. M-Ticket Style Review Card */}
      {activeCase ? (
        <div className="mticket-review-card">
          {/* Header */}
          <div className="mticket-header">
            <div className="mticket-identity">
              <span className="case-tag">CASE: {activeCase.caseId}</span>
              <StatusBadge status={activeCase.status} />
              <QueueBadge queue={activeCase.queue} />
            </div>

            <SLABadge caseItem={activeCase} simulatedNow={simulatedNow} variant="compact" />
          </div>

          {/* 4-Stage Lifecycle Stepper Tracker */}
          <div className="stage-tracker-wrapper" style={{ margin: '14px 0 20px 0' }}>
            <div className="stage-tracker-title">Pega Case Lifecycle Progress</div>
            <div className="stage-steps-row">
              {[
                { idx: 0, name: STAGES.INITIAL, label: 'Stage 1: Initial Stage', desc: 'Case intake & queue routing' },
                { idx: 1, name: STAGES.AVAILABILITY, label: 'Stage 2: Availability', desc: 'Screen capacity verified' },
                { idx: 2, name: STAGES.APPROVAL, label: 'Stage 3: Approval', desc: 'Customer review checkpoint' },
                { idx: 3, name: STAGES.EXECUTION, label: 'Stage 4: Booking Execution', desc: 'Seats locked & ticket issued' },
              ].map(step => {
                const isPassed = currentStageIdx > step.idx || (currentStageIdx === 3 && isConfirmed);
                const isCurrent = currentStageIdx === step.idx && !isConfirmed;
                const isFinalDone = currentStageIdx === 3 && step.idx === 3 && isConfirmed;

                let stepClass = 'stage-step-upcoming';
                if (isPassed || isFinalDone) stepClass = 'stage-step-completed';
                else if (isCurrent) stepClass = 'stage-step-active';

                return (
                  <div key={step.idx} className={`stage-step-item ${stepClass}`}>
                    <div className="stage-step-circle">
                      {isPassed || isFinalDone ? '✓' : step.idx + 1}
                    </div>
                    <div className="stage-step-meta">
                      <span className="stage-step-name">{step.name}</span>
                      <span className="stage-step-desc">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert / Stage Notice when awaiting customer confirmation */}
          {isAwaitingApproval && (
            <div className="checkpoint-alert-box" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
              <div className="alert-text-wrap">
                <div className="alert-headline" style={{ color: '#FBBF24', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconAlertCircle size={18} />
                  <span>Stage 3 Approval Checkpoint — Customer Review & Confirmation Required</span>
                </div>
                <div className="alert-desc" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: '1.5' }}>
                  Availability check has passed. Please verify your selected auditorium seats, tier, showtime, and total cost below. Click <strong>"Confirm & Execute Booking"</strong> to lock your seats and issue your official ticket pass.
                </div>
              </div>

              <div className="alert-buttons" style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button 
                  type="button" 
                  className="btn-primary-action"
                  style={{ background: '#10B981', borderColor: '#10B981', color: '#fff', padding: '10px 20px', fontWeight: '700', fontSize: '14px' }}
                  onClick={handleExplicitConfirm}
                >
                  ✓ Confirm & Execute Booking
                </button>
                <button 
                  type="button" 
                  className="btn-secondary-action"
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '10px 18px', fontWeight: '600' }}
                  onClick={handleExplicitCancel}
                >
                  ✕ Cancel Booking Request
                </button>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="confirmed-success-banner" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
              <div>
                <div className="success-title" style={{ color: '#34D399', fontSize: '16px', fontWeight: '700' }}>
                  ✓ Stage 4: Booking Executed & Confirmed
                </div>
                <div className="success-sub" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                  Booking Ref: <strong style={{ color: '#fff' }}>{activeCase.bookingReference}</strong> • Queue: <span className="font-mono">{activeCase.queue}</span> • Txn ID: <span className="font-mono">{activeCase.paymentTxnId || 'CW-TXN-OK'}</span> • Paid via {activeCase.paymentMethod || 'UPI'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  type="button"
                  className="btn-view-pass"
                  style={{ background: '#E50914', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setShowTicketModal(true)}
                >
                  <IconTicketStub size={16} />
                  View M-Ticket Pass
                </button>

                <button 
                  type="button"
                  className="btn-secondary-action"
                  style={{ background: '#25D366', color: '#000', fontWeight: '700', borderColor: 'transparent', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => setShowWhatsAppModal(true)}
                >
                  📱 WhatsApp Pass
                </button>
              </div>
            </div>
          )}

          {isRefunded && (
            <div className="cancelled-banner" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
              <div className="cancelled-title" style={{ color: '#FCA5A5', fontWeight: '700' }}>Booking Refunded ({formatINR(activeCase.refundAmount || activeCase.totalCost)})</div>
              <div className="cancelled-sub" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>This booking was cancelled and refund credit was dispatched to customer source account.</div>
            </div>
          )}

          {isCancelled && (
            <div className="cancelled-banner" style={{ background: 'rgba(113, 113, 122, 0.12)', borderColor: 'rgba(113, 113, 122, 0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
              <div className="cancelled-title" style={{ color: '#D4D4D8', fontWeight: '700' }}>Booking Request Cancelled</div>
              <div className="cancelled-sub" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>This case was closed at Stage 3 without locking auditorium seats.</div>
            </div>
          )}

          {/* Main Info Grid */}
          <div className="mticket-body-grid">
            {/* Left: Movie & Showtime */}
            <div className="movie-show-block">
              {movie?.posterUrl && (
                <img src={movie.posterUrl} alt={movie.title} className="review-poster" />
              )}
              <div className="review-details">
                <div className="badge-cert">{movie?.certificate || 'UA 13+'}</div>
                <h3 className="review-movie-title">{movie?.title}</h3>
                <div className="review-meta">{movie?.genre} • {movie?.durationMinutes} mins</div>

                <div className="theatre-info-box">
                  <div className="info-venue">{show?.theatre}</div>
                  <div className="info-screen">{show?.screen} ({show?.format || 'Standard'})</div>
                  <div className="info-location">{show?.city}, {show?.state}</div>
                  <div className="info-timing">
                    📅 {show?.date} at <strong>{show?.time}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Guest & Pricing Breakdown */}
            <div className="guest-cost-block">
              <div className="section-mini-title">Guest Details & Queue Assignment</div>
              <div className="guest-fields">
                <div><strong>Name:</strong> {activeCase.customerName}</div>
                <div><strong>Email:</strong> {activeCase.customerEmail}</div>
                <div><strong>Phone:</strong> {activeCase.customerPhone}</div>
                <div><strong>Assigned Queue:</strong> <span style={{ color: activeCase.queue?.includes('Premium') ? '#F59E0B' : '#60A5FA', fontWeight: '600' }}>{activeCase.queue}</span></div>
              </div>

              <div className="section-mini-title" style={{ marginTop: '14px' }}>Seat & Order Breakdown (INR)</div>
              <div className="seats-tag-row">
                {activeCase.selectedSeats?.map(s => (
                  <span key={s} className="seat-chip">{s}</span>
                ))}
                <span className="category-chip">({categoryConfig.label})</span>
              </div>

              {activeCase.foodItems && activeCase.foodItems.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--amber-500)' }}>
                  🍿 <strong>Pre-booked F&B Snacks Included</strong> ({activeCase.foodItems.length} items)
                </div>
              )}

              <div className="cost-breakdown-table">
                <div className="cost-line">
                  <span>Tickets ({activeCase.seatCount}x @ {categoryConfig.label}):</span>
                  <span>{formatINR(Math.round((show?.basePrice || 250) * categoryConfig.multiplier * activeCase.seatCount))}</span>
                </div>
                <div className="cost-line">
                  <span>Convenience Fee & Taxes:</span>
                  <span>{formatINR(35.40 * activeCase.seatCount)}</span>
                </div>
                <div className="cost-line total-line">
                  <span>Calculated Total:</span>
                  <span className="total-highlight">{formatINR(activeCase.totalCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="checkpoint-timeline">
            <div className="section-mini-title">Pega Case Audit & Event Trail</div>
            <div className="timeline-list">
              {activeCase.stageHistory?.map((ev, idx) => (
                <div key={idx} className="timeline-event">
                  <div className="timeline-dot" />
                  <div className="timeline-event-header">
                    <span className="timeline-action">{ev.action}</span>
                    <span className="timeline-time">{new Date(ev.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="timeline-notes">
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>[{ev.stage}] ({ev.actor}): </span>
                    {ev.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">No matching case found.</div>
      )}

      {/* Ticket Pass Modal */}
      {showTicketModal && activeCase && (
        <TicketStubModal 
          caseItem={activeCase} 
          show={show} 
          movie={movie} 
          onClose={() => setShowTicketModal(false)} 
        />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && activeCase && (
        <WhatsAppPreviewModal
          caseItem={activeCase}
          show={show}
          movie={movie}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
}