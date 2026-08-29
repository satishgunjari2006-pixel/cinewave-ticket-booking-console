import React from 'react';
import { formatINR } from '../../utils/costCalculator';

export function WhatsAppPreviewModal({ caseItem, show, movie, onClose }) {
  if (!caseItem) return null;

  const seatsList = Array.isArray(caseItem.selectedSeats) && caseItem.selectedSeats.length > 0
    ? caseItem.selectedSeats.join(', ')
    : `${caseItem.seatCount} seat(s)`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel whatsapp-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="whatsapp-phone-mock">
          {/* WhatsApp Header */}
          <div className="wa-header">
            <div className="wa-avatar">CW</div>
            <div className="wa-contact-info">
              <div className="wa-contact-name">CineWave Box Office ✔</div>
              <div className="wa-contact-status">Official Cinema Dispatch Service</div>
            </div>
            <button type="button" className="btn-close-wa" onClick={onClose}>✕</button>
          </div>

          {/* Chat Bubble Area */}
          <div className="wa-body">
            <div className="wa-bubble">
              <div className="wa-brand-tag">🎬 CINEWAVE M-TICKET PASS</div>

              <div className="wa-movie-title">{movie?.title}</div>
              <div className="wa-movie-cert">{movie?.certificate || 'UA 13+'} • {movie?.language}</div>

              <div className="wa-info-section">
                <div>📅 <strong>Date:</strong> {show?.date} at <strong>{show?.time}</strong></div>
                <div>📍 <strong>Venue:</strong> {show?.theatre} ({show?.city}, {show?.state})</div>
                <div>🎟️ <strong>Auditorium:</strong> {show?.screen}</div>
                <div>💺 <strong>Seats:</strong> {seatsList} ({caseItem.seatCategory})</div>
                <div>💰 <strong>Total Paid:</strong> {formatINR(caseItem.totalCost)}</div>
                <div>🆔 <strong>Booking Ref:</strong> <span className="font-mono">{caseItem.bookingReference || 'CW-TKT-DISPATCH'}</span></div>
              </div>

              <div className="wa-barcode-mock">
                <div className="wa-barcode-strip" />
                <span className="wa-ref">{caseItem.bookingReference || 'CW-TKT-DISPATCH'}</span>
              </div>

              <div className="wa-footer-msg">
                ✨ Show this digital message at theatre scanner. Doors open 15m prior.
              </div>

              <div className="wa-time-stamp">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>
          </div>

          <div className="wa-actions-bottom">
            <button type="button" className="btn-wa-dismiss" onClick={onClose}>
              Close WhatsApp Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
