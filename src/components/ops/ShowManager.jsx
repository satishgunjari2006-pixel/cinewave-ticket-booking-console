import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { SHOW_TYPES, LOCATIONS } from '../../data/types';
import { formatINR } from '../../utils/costCalculator';
import { IconSliders, IconFilmReel } from '../common/Icons';

export function ShowManager() {
  const { 
    shows, 
    movies, 
    selectedState,
    selectedCity,
    updateShowCapacity, 
    updateShowPricing, 
    addShow 
  } = useCaseContext();

  const [editingShowId, setEditingShowId] = useState(null);
  const [editCapacity, setEditCapacity] = useState('');
  const [editRemaining, setEditRemaining] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newShowData, setNewShowData] = useState({
    movieId: movies[0]?.id || '',
    state: selectedState || 'Telangana',
    city: selectedCity || 'Hyderabad',
    theatre: 'Prasads Multiplex IMAX',
    theatreLocation: 'Khairatabad, Hyderabad',
    screen: 'Screen 2 (Dolby Atmos)',
    date: '2026-08-28',
    time: '21:30',
    format: 'Dolby Atmos 4K',
    showType: SHOW_TYPES.PREMIUM,
    totalCapacity: 180,
    seatsRemaining: 180,
    basePrice: 350,
  });

  const handleStartEdit = (s) => {
    setEditingShowId(s.id);
    setEditCapacity(s.totalCapacity);
    setEditRemaining(s.seatsRemaining);
    setEditPrice(s.basePrice);
  };

  const handleSaveEdit = (showId) => {
    updateShowCapacity(showId, editCapacity, editRemaining);
    updateShowPricing(showId, editPrice);
    setEditingShowId(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addShow(newShowData);
    setShowAddModal(false);
  };

  return (
    <div className="ops-container">
      <div className="table-header-bar" style={{ borderRadius: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', padding: '18px 24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSliders size={20} />
            <span>Multiplex Show Schedule & Seating Capacity Inventory</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage auditorium capacities, remaining seat allocations, base ticket rates (INR), and schedule new screenings across Indian multiplexes.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary-action"
          onClick={() => setShowAddModal(true)}
        >
          + Schedule New Showtime
        </button>
      </div>

      <div className="case-table-card">
        <div className="table-scroll-wrap">
          <table className="case-data-table">
            <thead>
              <tr>
                <th>Show ID</th>
                <th>Feature Movie</th>
                <th>Location & Theatre</th>
                <th>Screen & Format</th>
                <th>Date & Time</th>
                <th>Queue Tier</th>
                <th>Total Capacity</th>
                <th>Seats Remaining</th>
                <th>Base Rate (INR)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shows.map((s) => {
                const movie = movies.find(m => m.id === s.movieId);
                const isEditing = editingShowId === s.id;
                const capacityPct = Math.round((s.seatsRemaining / s.totalCapacity) * 100);

                return (
                  <tr key={s.id} className="case-row">
                    <td className="case-id-cell">{s.id}</td>

                    <td>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{movie?.title || 'Unknown Title'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{movie?.genre} ({movie?.certificate})</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.theatre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.city}, {s.state}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{s.screen}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.format || 'Standard'}</div>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                        {s.date}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--amber-500)' }}>
                        {s.time}
                      </div>
                    </td>

                    <td>
                      <span className={`queue-badge ${s.showType === 'Premium' ? 'queue-premium' : 'queue-standard'}`}>
                        {s.showType}
                      </span>
                    </td>

                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editCapacity} 
                          onChange={e => setEditCapacity(e.target.value)}
                          style={{ width: '80px', padding: '4px 6px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                          {s.totalCapacity} seats
                        </span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editRemaining} 
                          onChange={e => setEditRemaining(e.target.value)}
                          style={{ width: '80px', padding: '4px 6px' }}
                        />
                      ) : (
                        <div>
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: '700',
                            color: s.seatsRemaining <= 15 ? 'var(--danger-red)' : 'var(--emerald-500)'
                          }}>
                            {s.seatsRemaining} seats left ({capacityPct}%)
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editPrice} 
                          onChange={e => setEditPrice(e.target.value)}
                          style={{ width: '80px', padding: '4px 6px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#fff' }}>
                          {formatINR(s.basePrice, false)}
                        </span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            type="button" 
                            className="btn-primary-action"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleSaveEdit(s.id)}
                          >
                            Save
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary-action"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => setEditingShowId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-secondary-action"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          onClick={() => handleStartEdit(s)}
                        >
                          Adjust Capacity / Price
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Showtime Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Schedule New Multiplex Screening</div>
              <button type="button" className="btn-secondary-action" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Feature Film</label>
                  <select 
                    value={newShowData.movieId}
                    onChange={e => setNewShowData({ ...newShowData, movieId: e.target.value })}
                  >
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.certificate})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select 
                      value={newShowData.state}
                      onChange={e => {
                        const loc = LOCATIONS.find(l => l.state === e.target.value);
                        setNewShowData({ 
                          ...newShowData, 
                          state: e.target.value,
                          city: loc ? loc.cities[0].city : 'Hyderabad'
                        });
                      }}
                    >
                      {LOCATIONS.map(l => (
                        <option key={l.state} value={l.state}>{l.state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      required
                      value={newShowData.city}
                      onChange={e => setNewShowData({ ...newShowData, city: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Theatre Venue Name</label>
                    <input 
                      type="text" 
                      required
                      value={newShowData.theatre}
                      onChange={e => setNewShowData({ ...newShowData, theatre: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Screen / Auditorium</label>
                    <input 
                      type="text" 
                      required
                      value={newShowData.screen}
                      onChange={e => setNewShowData({ ...newShowData, screen: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Screening Date</label>
                    <input 
                      type="date" 
                      required
                      value={newShowData.date}
                      onChange={e => setNewShowData({ ...newShowData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Showtime</label>
                    <input 
                      type="time" 
                      required
                      value={newShowData.time}
                      onChange={e => setNewShowData({ ...newShowData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Queue Tier</label>
                    <select 
                      value={newShowData.showType}
                      onChange={e => setNewShowData({ ...newShowData, showType: e.target.value })}
                    >
                      <option value={SHOW_TYPES.STANDARD}>Standard</option>
                      <option value={SHOW_TYPES.PREMIUM}>Premium</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Capacity</label>
                    <input 
                      type="number" 
                      required
                      value={newShowData.totalCapacity}
                      onChange={e => setNewShowData({ ...newShowData, totalCapacity: e.target.value, seatsRemaining: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Base Rate (INR ₹)</label>
                    <input 
                      type="number" 
                      required
                      value={newShowData.basePrice}
                      onChange={e => setNewShowData({ ...newShowData, basePrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary-action" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-action">Add Screening Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
