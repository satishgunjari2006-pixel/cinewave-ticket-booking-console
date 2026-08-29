import React, { useState } from 'react';
import { formatINR } from '../../utils/costCalculator';
import { FOOD_BEVERAGE_MENU } from '../../data/types';
import { WhatsAppPreviewModal } from './WhatsAppPreviewModal';

export function TicketStubModal({ caseItem, show, movie, onClose }) {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  if (!caseItem) return null;

  const seatsList = Array.isArray(caseItem.selectedSeats) && caseItem.selectedSeats.length > 0
    ? caseItem.selectedSeats.join(', ')
    : `${caseItem.seatCount} seat(s) (${caseItem.seatCategory})`;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-panel" style={{ maxWidth: '500px', background: 'transparent', border: 'none', boxShadow: 'none' }} onClick={e => e.stopPropagation()}>
          <div className="ticket-stub-container">
            <div className="ticket-header-top">
              <div>
                <div className="ticket-logo-text">CINEWAVE</div>
                <div style={{ fontSize: '10px', color: 'var(--ticket-ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Indian Multiplex Digital M-Ticket
                </div>
              </div>
              <div className="ticket-pass-type">
                {show?.showType || 'STANDARD'} PASS
              </div>
            </div>

            <div className="ticket-movie-title">
              {movie?.title || 'Selected Feature Film'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ticket-ink-muted)', marginBottom: '8px' }}>
              Rating: <strong>{movie?.certificate || 'UA 13+'}</strong> • Runtime: <strong>{movie?.durationMinutes || '120'} MINS</strong> • Language: <strong>{movie?.language || 'English'}</strong>
            </div>

            <div className="ticket-details-grid">
              <div>
                <div className="ticket-field-label">Cinema Location</div>
                <div className="ticket-field-val">{show?.theatre || 'Multiplex'}</div>
                <div style={{ fontSize: '10px', color: 'var(--ticket-ink-muted)' }}>{show?.city}, {show?.state}</div>
              </div>

              <div>
                <div className="ticket-field-label">Auditorium / Screen</div>
                <div className="ticket-field-val">{show?.screen || 'Screen 1'}</div>
                <div style={{ fontSize: '10px', color: 'var(--ticket-ink-muted)' }}>{show?.format || '2D Digital'}</div>
              </div>

              <div>
                <div className="ticket-field-label">Show Date & Time</div>
                <div className="ticket-field-val">{show?.date} — {show?.time}</div>
              </div>

              <div>
                <div className="ticket-field-label">Allocated Seats</div>
                <div className="ticket-field-val">{seatsList}</div>
              </div>

              <div>
                <div className="ticket-field-label">Category Tier</div>
                <div className="ticket-field-val">{caseItem.seatCategory}</div>
              </div>

              <div>
                <div className="ticket-field-label">Total Amount Paid</div>
                <div className="ticket-field-val">{formatINR(caseItem.totalCost)}</div>
              </div>

              <div>
                <div className="ticket-field-label">Guest Holder</div>
                <div className="ticket-field-val">{caseItem.customerName}</div>
              </div>

              <div>
                <div className="ticket-field-label">Payment Txn / Ref</div>
                <div className="ticket-field-val" style={{ fontFamily: 'var(--font-mono)' }}>{caseItem.paymentTxnId || caseItem.caseId}</div>
              </div>
            </div>

            {/* F&B Items if present */}
            {Array.isArray(caseItem.foodItems) && caseItem.foodItems.length > 0 && (
              <div style={{ padding: '8px 12px', background: '#F3F4F6', borderRadius: '4px', margin: '8px 0', fontSize: '11px', border: '1px dashed #D1D5DB' }}>
                <div style={{ fontWeight: '800', color: '#111827', textTransform: 'uppercase', marginBottom: '2px' }}>
                  🍿 Concession Snack Voucher Included:
                </div>
                {caseItem.foodItems.map(f => {
                  const menu = FOOD_BEVERAGE_MENU.find(m => m.id === f.id);
                  return (
                    <div key={f.id} style={{ color: '#374151' }}>
                      • {f.quantity}x {menu?.name || 'Cinema Snack'} ({menu?.portion})
                    </div>
                  );
                })}
              </div>
            )}

            <div className="ticket-barcode-block">
              <div className="ticket-barcode-mock" />
              <div className="ticket-ref-text">{caseItem.bookingReference || 'CW-TKT-SAMPLE'}</div>
              <div style={{ fontSize: '10px', color: 'var(--ticket-ink-muted)' }}>
                Scan this digital QR/barcode at {show?.theatre || 'multiplex'} entrance.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn-primary-action"
                style={{ background: 'var(--ticket-ink)', color: '#fff', fontSize: '12px' }}
                onClick={() => window.print()}
              >
                Print Ticket
              </button>

              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ background: '#25D366', color: '#000', fontWeight: '700', fontSize: '12px', borderColor: 'transparent' }}
                onClick={() => setShowWhatsAppModal(true)}
              >
                📲 WhatsApp Pass
              </button>

              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ background: 'transparent', borderColor: 'var(--ticket-border)', color: 'var(--ticket-ink)', fontSize: '12px' }}
                onClick={onClose}
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      </div>

      {showWhatsAppModal && (
        <WhatsAppPreviewModal
          caseItem={caseItem}
          show={show}
          movie={movie}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </>
  );
}
