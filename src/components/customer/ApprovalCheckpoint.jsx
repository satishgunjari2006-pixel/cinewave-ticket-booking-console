import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { STATUSES, STAGES, SEAT_CATEGORIES } from '../../data/types';
import { formatINR, calculateRefundAmount } from '../../utils/costCalculator';
import { IconTicketStub, IconFilmReel, IconSeat, IconSLAClock } from '../common/Icons';
import { TicketStubModal } from './TicketStubModal';
import { WhatsAppPreviewModal } from './WhatsAppPreviewModal';

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
    || cases.find(c => c.stage?.includes('Approval')) 
    || cases[0];

  const { movie, show } = getCaseEntities(activeCase);
  const categoryConfig = SEAT_CATEGORIES[activeCase?.seatCategory] || SEAT_CATEGORIES.STANDARD;

  const isAwaitingApproval = activeCase?.stage?.includes('Approval') && activeCase?.status === STATUSES.PENDING_APPROVAL;
  const isConfirmed = activeCase?.status === STATUSES.RESOLVED_CONFIRMED;
  const isCancelled = activeCase?.status === STATUSES.RESOLVED_CANCELLED;
  const isRefunded = activeCase?.status === STATUSES.RESOLVED_REFUNDED;

  const refundPreview = activeCase ? calculateRefundAmount(activeCase.totalCost, 24) : null;

  return (
    <div className="checkpoint-container">
      {/* 1. Quick Case Lookup Bar */}
      <div className="lookup-bar">
        <div>
          <h2 className="lookup-title">Customer Confirmation Checkpoint & Case Tracker</h2>
          <p className="lookup-sub">
            Review your cinema reservation details, lock your seats, or track case progress.
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
                {c.caseId} — {c.customerName} ({c.status})
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

          {/* Alert / Stage Notice */}
          {isAwaitingApproval && (
            <div className="checkpoint-alert-box">
              <div className="alert-text-wrap">
                <div className="alert-headline">
                  <IconSLAClock size={16} />
                  <span>Stage 3 Approval — Customer Confirmation Required</span>
                </div>
                <div className="alert-desc">
                  Your seat inventory has been verified. Please review the auditorium showtime and calculated total cost below to confirm your booking and lock your seats.
                </div>
              </div>

              <div className="alert-buttons">
                <button
                  type="button"
                  className="btn-confirm-action"
                  onClick={() => confirmBooking(activeCase.caseId, 'Customer (Explicit Confirmation Checkpoint)')}
                >
                  Confirm & Lock Seats ({formatINR(activeCase.totalCost)})
                </button>

                <button
                  type="button"
                  className="btn-cancel-link"
                  onClick={() => {
                    if (window.confirm(`Cancel booking? Refund amount eligible: ${refundPreview?.formattedRefundAmount}`)) {
                      processRefund(activeCase.caseId, 'Customer cancelled with refund request', 'Customer');
                    }
                  }}
                >
                  Cancel & Request Refund
                </button>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="confirmed-success-banner">
              <div>
                <div className="success-title">✓ Booking Confirmed & Executed</div>
                <div className="success-sub">
                  Booking Ref: <strong>{activeCase.bookingReference}</strong> • Txn ID: <span className="font-mono">{activeCase.paymentTxnId || 'CW-TXN-OK'}</span> • Paid via {activeCase.paymentMethod || 'UPI'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn-view-pass"
                  onClick={() => setShowTicketModal(true)}
                >
                  <IconTicketStub size={16} />
                  View M-Ticket Pass
                </button>

                <button 
                  type="button"
                  className="btn-secondary-action"
                  style={{ background: '#25D366', color: '#000', fontWeight: '700', borderColor: 'transparent' }}
                  onClick={() => setShowWhatsAppModal(true)}
                >
                  📲 WhatsApp Pass
                </button>
              </div>
            </div>
          )}

          {isRefunded && (
            <div className="cancelled-banner" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="cancelled-title" style={{ color: '#FCA5A5' }}>Booking Refunded ({formatINR(activeCase.refundAmount || activeCase.totalCost)})</div>
              <div className="cancelled-sub">This booking was cancelled and refund credit was dispatched to customer source account.</div>
            </div>
          )}

          {isCancelled && (
            <div className="cancelled-banner">
              <div className="cancelled-title">Booking Request Cancelled</div>
              <div className="cancelled-sub">This case was closed without seat reservation.</div>
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
              <div className="section-mini-title">Guest Details</div>
              <div className="guest-fields">
                <div><strong>Name:</strong> {activeCase.customerName}</div>
                <div><strong>Email:</strong> {activeCase.customerEmail}</div>
                <div><strong>Phone:</strong> {activeCase.customerPhone}</div>
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
                  <span>Tickets ({activeCase.seatCount}x):</span>
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
            <div className="section-mini-title">Case Activity Log</div>
            <div className="timeline-list">
              {activeCase.stageHistory?.map((ev, idx) => (
                <div key={idx} className="timeline-event">
                  <div className="timeline-dot" />
                  <div className="timeline-event-header">
                    <span className="timeline-action">{ev.action}</span>
                    <span className="timeline-time">{new Date(ev.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="timeline-notes">{ev.notes}</div>
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
