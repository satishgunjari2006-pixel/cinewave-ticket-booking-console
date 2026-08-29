import React from 'react';
import { LOCATIONS } from '../../data/types';

export function LocationModal({ selectedCity, onSelectLocation, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel location-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Select Your Cinema Location</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Choose city to view multiplex showtimes and ticket availability
            </span>
          </div>
          <button type="button" className="btn-secondary-action" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body location-modal-body">
          <div className="locations-grid">
            {LOCATIONS.map((loc) => (
              <div key={loc.state} className="state-group">
                <div className="state-title">{loc.state}</div>
                <div className="cities-list">
                  {loc.cities.map((c) => {
                    const isSelected = selectedCity === c.city;
                    return (
                      <button
                        key={c.city}
                        type="button"
                        className={`city-pill-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectLocation(loc.state, c.city);
                          onClose();
                        }}
                      >
                        <span className="city-name">{c.city}</span>
                        <span className="theatre-count">{c.theatres.length} Multiplexes</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary-action" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
