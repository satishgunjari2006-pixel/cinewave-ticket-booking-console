import React, { useState, useEffect } from 'react';
import { SEAT_CATEGORIES } from '../../data/types';
import { calculateTotalCost, formatINR } from '../../utils/costCalculator';

const TIERS = [
  {
    key: 'RECLINER',
    title: 'VIP RECLINER SUITE',
    rows: ['A', 'B'],
    categoryKey: 'RECLINER',
    sightline: '95% Ultra-Panoramic Sightline • Plush Recline Angle',
  },
  {
    key: 'PRIME',
    title: 'PRIME CENTER',
    rows: ['C', 'D', 'E'],
    categoryKey: 'PRIME',
    sightline: '99% Optimal Center-Screen Sightline • Golden Viewing Cone',
  },
  {
    key: 'STANDARD',
    title: 'CLASSIC STANDARD',
    rows: ['F', 'G'],
    categoryKey: 'STANDARD',
    sightline: '90% Full Auditorium Perspective • Elevated Angle',
  },
];

const SEATS_SECTION_1 = [1, 2, 3, 4];
const SEATS_SECTION_2 = [5, 6, 7, 8];
const SEATS_SECTION_3 = [9, 10, 11, 12];

const DEFAULT_OCCUPIED_SEATS = ['A1', 'A2', 'B7', 'B8', 'C3', 'C4', 'D6', 'D7', 'E11', 'E12', 'F2', 'F3', 'G9', 'G10'];

export function SeatPicker({
  show,
  movie,
  seatCategory,
  setSeatCategory,
  selectedSeats,
  setSelectedSeats,
  foodItems = [],
  onProceed,
  onBack,
}) {
  const [hoveredSeat, setHoveredSeat] = useState(null);

  const seatCount = Math.max(1, selectedSeats.length);
  const costCalc = calculateTotalCost(show, seatCount, seatCategory, foodItems);

  // Auto-determine category based on selected seats
  useEffect(() => {
    if (selectedSeats.length > 0) {
      const firstRow = selectedSeats[0].charAt(0);
      if (['A', 'B'].includes(firstRow)) setSeatCategory('RECLINER');
      else if (['C', 'D', 'E'].includes(firstRow)) setSeatCategory('PRIME');
      else setSeatCategory('STANDARD');
    }
  }, [selectedSeats, setSeatCategory]);

  const toggleSeat = (seatId, rowCategory) => {
    if (DEFAULT_OCCUPIED_SEATS.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSeatCategory(rowCategory);
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatSightline = (seatId) => {
    if (!seatId) return null;
    const row = seatId.charAt(0);
    const num = parseInt(seatId.slice(1), 10);
    const tier = TIERS.find(t => t.rows.includes(row));
    const isCenter = num >= 5 && num <= 8;

    return {
      seatId,
      tier: tier ? tier.title : 'Standard',
      sightline: tier ? tier.sightline : 'Standard Sightline',
      isCenter,
    };
  };

  const activeSightline = hoveredSeat 
    ? getSeatSightline(hoveredSeat)
    : (selectedSeats.length > 0 ? getSeatSightline(selectedSeats[selectedSeats.length - 1]) : null);

  return (
    <div className="bms-seat-picker-container">
      {/* 1. Header Bar */}
      <div className="seat-picker-header">
        <div className="header-info">
          <button type="button" className="btn-back-link" onClick={onBack}>
            ← Change Show
          </button>
          <div>
            <h2 className="header-movie-title">{movie?.title}</h2>
            <div className="header-sub">
              {show?.theatre} • {show?.screen} | <strong>{show?.date} at {show?.time}</strong> ({show?.city})
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="seat-legend-bar">
          <div className="legend-chip">
            <div className="seat-glyph seat-available" />
            <span>Available</span>
          </div>
          <div className="legend-chip">
            <div className="seat-glyph seat-selected" />
            <span>Selected</span>
          </div>
          <div className="legend-chip">
            <div className="seat-glyph seat-occupied" />
            <span>Sold</span>
          </div>
        </div>
      </div>

      {/* Sightline POV Bar */}
      <div className="sightline-preview-banner">
        <span className="pov-icon">👁️</span>
        <div className="sightline-text-wrap">
          {activeSightline ? (
            <>
              <strong>Seat {activeSightline.seatId} ({activeSightline.tier}):</strong> {activeSightline.sightline} {activeSightline.isCenter ? '• ★ Prime Center Sound Alignment' : ''}
            </>
          ) : (
            <span>Hover or select any seat to inspect eye-level cinema screen POV and sightline alignment.</span>
          )}
        </div>
      </div>

      {/* 2. Auditorium View with Curved Screen & Tiers */}
      <div className="auditorium-box">
        {/* Tier Sections */}
        <div className="tiers-container">
          {TIERS.map(tier => {
            const catConfig = SEAT_CATEGORIES[tier.categoryKey];
            const price = Math.round((show?.basePrice || 250) * catConfig.multiplier);

            return (
              <div key={tier.key} className="tier-section">
                <div className="tier-header-label">
                  <span>{tier.title} — {formatINR(price, false)}</span>
                  <span className="tier-sub">({catConfig.badge} Tier)</span>
                </div>

                <div className="tier-rows">
                  {tier.rows.map(row => (
                    <div key={row} className="bms-seat-row">
                      <span className="bms-row-letter">{row}</span>

                      {/* Section 1 */}
                      <div className="seat-section-block">
                        {SEATS_SECTION_1.map(num => {
                          const seatId = `${row}${num}`;
                          const isOccupied = DEFAULT_OCCUPIED_SEATS.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);

                          return (
                            <button
                              key={seatId}
                              type="button"
                              disabled={isOccupied}
                              className={`bms-seat-btn ${isOccupied ? 'sold' : ''} ${isSelected ? 'selected' : ''}`}
                              onMouseEnter={() => setHoveredSeat(seatId)}
                              onMouseLeave={() => setHoveredSeat(null)}
                              onClick={() => toggleSeat(seatId, tier.categoryKey)}
                              title={isOccupied ? `Seat ${seatId} (Sold)` : `Seat ${seatId} (${formatINR(price, false)})`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      <div className="aisle-gap" />

                      {/* Section 2 */}
                      <div className="seat-section-block">
                        {SEATS_SECTION_2.map(num => {
                          const seatId = `${row}${num}`;
                          const isOccupied = DEFAULT_OCCUPIED_SEATS.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);

                          return (
                            <button
                              key={seatId}
                              type="button"
                              disabled={isOccupied}
                              className={`bms-seat-btn ${isOccupied ? 'sold' : ''} ${isSelected ? 'selected' : ''}`}
                              onMouseEnter={() => setHoveredSeat(seatId)}
                              onMouseLeave={() => setHoveredSeat(null)}
                              onClick={() => toggleSeat(seatId, tier.categoryKey)}
                              title={isOccupied ? `Seat ${seatId} (Sold)` : `Seat ${seatId} (${formatINR(price, false)})`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      <div className="aisle-gap" />

                      {/* Section 3 */}
                      <div className="seat-section-block">
                        {SEATS_SECTION_3.map(num => {
                          const seatId = `${row}${num}`;
                          const isOccupied = DEFAULT_OCCUPIED_SEATS.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);

                          return (
                            <button
                              key={seatId}
                              type="button"
                              disabled={isOccupied}
                              className={`bms-seat-btn ${isOccupied ? 'sold' : ''} ${isSelected ? 'selected' : ''}`}
                              onMouseEnter={() => setHoveredSeat(seatId)}
                              onMouseLeave={() => setHoveredSeat(null)}
                              onClick={() => toggleSeat(seatId, tier.categoryKey)}
                              title={isOccupied ? `Seat ${seatId} (Sold)` : `Seat ${seatId} (${formatINR(price, false)})`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      <span className="bms-row-letter">{row}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Curved Screen */}
        <div className="bms-curved-screen-wrap">
          <div className="bms-curved-screen" />
          <div className="screen-glow" />
          <div className="screen-caption">All eyes this way please! (Auditorium Screen)</div>
        </div>
      </div>

      {/* 3. Sticky Floating Checkout Bar in INR (₹) */}
      <div className="sticky-checkout-bar">
        <div className="checkout-bar-inner">
          <div className="selection-details">
            <div className="selected-seats-badge">
              {selectedSeats.length > 0 ? (
                <>
                  <span className="count-pill">{selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}</span>
                  <span className="seats-text">{selectedSeats.join(', ')}</span>
                  <span className="tier-tag">({SEAT_CATEGORIES[seatCategory]?.label})</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Please select your seats on the map above</span>
              )}
            </div>

            <div className="price-breakdown-sub">
              Ticket: {costCalc.formattedTicketSubtotal} + Convenience & GST: {costCalc.formattedTicketServiceFee}
            </div>
          </div>

          <div className="checkout-action-wrap">
            <div className="total-price-box">
              <span className="total-label">Calculated Total (INR)</span>
              <span className="total-amount">{costCalc.formattedTotal}</span>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0}
              className="btn-bms-proceed"
              onClick={onProceed}
            >
              Add Snacks / Proceed →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
