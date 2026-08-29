import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { SHOW_TYPES, LOCATIONS } from '../../data/types';
import { formatINR } from '../../utils/costCalculator';
import { IconSliders, IconFilmReel, IconAlertCircle } from '../common/Icons';

export function ShowManager() {
  const { 
    shows, 
    movies, 
    selectedState,
    selectedCity,
    updateShowCapacity, 
    updateShowPricing, 
    addShow,
    deleteShow,
    addMovie,
    updateMovie,
    deleteMovie
  } = useCaseContext();

  const [activeTab, setActiveTab] = useState('shows'); // 'shows' | 'movies'

  // Show inline edit state
  const [editingShowId, setEditingShowId] = useState(null);
  const [editCapacity, setEditCapacity] = useState('');
  const [editRemaining, setEditRemaining] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Add Show modal state
  const [showAddShowModal, setShowAddShowModal] = useState(false);
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

  // Movie CRUD state
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieFormData, setMovieFormData] = useState({
    title: '',
    genre: 'Action • Adventure',
    language: 'English, Hindi',
    durationMinutes: 150,
    certificate: 'UA 13+',
    ratingScore: 8.5,
    votesCount: '50K votes',
    synopsis: '',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    formatsText: 'IMAX 2D, 4DX, Dolby Atmos, 2D',
    tagsText: 'Now Showing, Blockbuster',
  });

  const handleStartEditShow = (s) => {
    setEditingShowId(s.id);
    setEditCapacity(s.totalCapacity);
    setEditRemaining(s.seatsRemaining);
    setEditPrice(s.basePrice);
  };

  const handleSaveEditShow = (showId) => {
    updateShowCapacity(showId, editCapacity, editRemaining);
    updateShowPricing(showId, editPrice);
    setEditingShowId(null);
  };

  const handleAddShowSubmit = (e) => {
    e.preventDefault();
    addShow(newShowData);
    setShowAddShowModal(false);
  };

  const handleDeleteShow = (showId) => {
    if (window.confirm(`Are you sure you want to delete showtime ${showId}?`)) {
      const res = deleteShow(showId);
      if (!res.success) alert(res.message);
    }
  };

  // Movie Handlers
  const handleOpenAddMovie = () => {
    setEditingMovie(null);
    setMovieFormData({
      title: '',
      genre: 'Action • Sci-Fi • Thriller',
      language: 'English, Hindi',
      durationMinutes: 145,
      certificate: 'UA 13+',
      ratingScore: 8.2,
      votesCount: '25K votes',
      synopsis: 'An epic cinematic journey into high-stakes adventure.',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
      formatsText: 'IMAX 2D, 4DX, Dolby Atmos, 2D',
      tagsText: 'Trending #1, IMAX Laser',
    });
    setShowAddMovieModal(true);
  };

  const handleOpenEditMovie = (m) => {
    setEditingMovie(m);
    setMovieFormData({
      title: m.title,
      genre: m.genre,
      language: m.language,
      durationMinutes: m.durationMinutes,
      certificate: m.certificate,
      ratingScore: m.ratingScore,
      votesCount: m.votesCount,
      synopsis: m.synopsis,
      posterUrl: m.posterUrl,
      bannerUrl: m.bannerUrl || '',
      formatsText: Array.isArray(m.formats) ? m.formats.join(', ') : '2D',
      tagsText: Array.isArray(m.tags) ? m.tags.join(', ') : 'Now Showing',
    });
    setShowAddMovieModal(true);
  };

  const handleMovieFormSubmit = (e) => {
    e.preventDefault();
    const formats = movieFormData.formatsText.split(',').map(s => s.trim()).filter(Boolean);
    const tags = movieFormData.tagsText.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      title: movieFormData.title,
      genre: movieFormData.genre,
      language: movieFormData.language,
      durationMinutes: parseInt(movieFormData.durationMinutes, 10) || 120,
      certificate: movieFormData.certificate,
      ratingScore: parseFloat(movieFormData.ratingScore) || 8.0,
      votesCount: movieFormData.votesCount,
      synopsis: movieFormData.synopsis,
      posterUrl: movieFormData.posterUrl,
      bannerUrl: movieFormData.bannerUrl,
      formats,
      tags,
    };

    if (editingMovie) {
      updateMovie(editingMovie.id, payload);
    } else {
      addMovie(payload);
    }
    setShowAddMovieModal(false);
  };

  const handleDeleteMovie = (movieId, movieTitle) => {
    if (window.confirm(`Delete movie "${movieTitle}"? This will only succeed if no active showtimes are linked.`)) {
      const res = deleteMovie(movieId);
      if (!res.success) alert(res.message);
    }
  };

  return (
    <div className="ops-container">
      {/* Top Banner & Tab Switcher */}
      <div className="table-header-bar" style={{ borderRadius: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSliders size={20} />
            <span>Staff Inventory & Movie Catalog Management</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage movie feature records, auditorium seating capacity, base rates (INR), and screening schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'shows' ? (
            <button 
              type="button" 
              className="btn-primary-action"
              onClick={() => setShowAddShowModal(true)}
            >
              + Schedule New Showtime
            </button>
          ) : (
            <button 
              type="button" 
              className="btn-primary-action"
              onClick={handleOpenAddMovie}
            >
              + Add New Movie Record
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <button
          type="button"
          className={`portal-nav-btn ${activeTab === 'shows' ? 'active' : ''}`}
          style={{ borderRadius: '6px', padding: '8px 18px', fontSize: '13px' }}
          onClick={() => setActiveTab('shows')}
        >
          🎬 Showtimes & Auditorium Inventory ({shows.length})
        </button>
        <button
          type="button"
          className={`portal-nav-btn ${activeTab === 'movies' ? 'active' : ''}`}
          style={{ borderRadius: '6px', padding: '8px 18px', fontSize: '13px' }}
          onClick={() => setActiveTab('movies')}
        >
          🎞️ Staff Movie Database ({movies.length} Movies)
        </button>
      </div>

      {/* TAB 1: SHOWS & SCREENS */}
      {activeTab === 'shows' && (
        <div className="case-table-card">
          <div className="table-scroll-wrap">
            <table className="case-data-table">
              <thead>
                <tr>
                  <th>Show ID</th>
                  <th>Movie Feature</th>
                  <th>Theatre & Screen</th>
                  <th>Format / Queue</th>
                  <th>Date & Time</th>
                  <th>Capacity (Total / Rem)</th>
                  <th>Base Rate (INR)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map(s => {
                  const mov = movies.find(m => m.id === s.movieId);
                  const isEditing = editingShowId === s.id;
                  const isPremium = s.showType === SHOW_TYPES.PREMIUM || s.format?.match(/IMAX|4DX|Dolby|70mm|Luxe|VIP/i);

                  return (
                    <tr key={s.id}>
                      <td className="font-mono" style={{ fontWeight: '700', color: 'var(--amber-400)' }}>
                        {s.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{mov?.title || s.movieId}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.city}, {s.state}</span>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)' }}>{s.theatre}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.screen}</div>
                      </td>
                      <td>
                        <span className={`queue-badge ${isPremium ? 'queue-premium' : 'queue-standard'}`}>
                          {s.format} ({isPremium ? 'Premium' : 'Standard'})
                        </span>
                      </td>
                      <td>
                        <div>{s.date}</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--amber-300)' }}>{s.time}</div>
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input 
                              type="number"
                              className="search-input"
                              style={{ width: '60px', padding: '2px 4px', fontSize: '12px' }}
                              value={editRemaining}
                              onChange={e => setEditRemaining(e.target.value)}
                              title="Remaining"
                            />
                            <span>/</span>
                            <input 
                              type="number"
                              className="search-input"
                              style={{ width: '60px', padding: '2px 4px', fontSize: '12px' }}
                              value={editCapacity}
                              onChange={e => setEditCapacity(e.target.value)}
                              title="Total Capacity"
                            />
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: '700', color: s.seatsRemaining <= 10 ? '#EF4444' : '#10B981' }}>
                              {s.seatsRemaining}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}> / {s.totalCapacity}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input 
                            type="number"
                            className="search-input"
                            style={{ width: '70px', padding: '2px 4px', fontSize: '12px' }}
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: '600' }}>{formatINR(s.basePrice)}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              type="button"
                              className="btn-primary-action"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                              onClick={() => handleSaveEditShow(s.id)}
                            >
                              Save
                            </button>
                            <button 
                              type="button"
                              className="btn-secondary-action"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                              onClick={() => setEditingShowId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              type="button"
                              className="btn-secondary-action"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleStartEditShow(s)}
                            >
                              Edit
                            </button>
                            <button 
                              type="button"
                              className="btn-secondary-action"
                              style={{ padding: '3px 6px', fontSize: '11px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => handleDeleteShow(s.id)}
                              title="Delete Show"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF MOVIE DATABASE (Add/Edit Movie records) */}
      {activeTab === 'movies' && (
        <div className="case-table-card">
          <div className="table-scroll-wrap">
            <table className="case-data-table">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Movie ID & Title</th>
                  <th>Genre & Certificate</th>
                  <th>Language & Runtime</th>
                  <th>Rating</th>
                  <th>Available Formats</th>
                  <th>Scheduled Shows</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(m => {
                  const linkedShowsCount = shows.filter(s => s.movieId === m.id).length;

                  return (
                    <tr key={m.id}>
                      <td style={{ width: '60px' }}>
                        <img 
                          src={m.posterUrl} 
                          alt={m.title} 
                          style={{ width: '44px', height: '62px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} 
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{m.title}</div>
                        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--amber-400)' }}>{m.id}</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.synopsis}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)' }}>{m.genre}</div>
                        <span className="badge-cert" style={{ marginTop: '3px', display: 'inline-block' }}>{m.certificate}</span>
                      </td>
                      <td>
                        <div>{m.language}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.durationMinutes} mins</span>
                      </td>
                      <td>
                        <span style={{ color: '#FBBF24', fontWeight: '700' }}>⭐ {m.ratingScore}</span>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.votesCount}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {m.formats?.map(f => (
                            <span key={f} className="tag-pill" style={{ fontSize: '10px' }}>{f}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="tab-badge" style={{ background: linkedShowsCount > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(113, 113, 122, 0.15)', color: linkedShowsCount > 0 ? '#60A5FA' : '#A1A1AA' }}>
                          {linkedShowsCount} shows
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            type="button"
                            className="btn-secondary-action"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleOpenEditMovie(m)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            className="btn-secondary-action"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            onClick={() => handleDeleteMovie(m.id, m.title)}
                            title="Delete Movie"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MOVIE RECORD */}
      {showAddMovieModal && (
        <div className="modal-backdrop" onClick={() => setShowAddMovieModal(false)}>
          <div className="modal-panel" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie Record'}
              </div>
              <button type="button" className="btn-secondary-action" onClick={() => setShowAddMovieModal(false)}>✕</button>
            </div>

            <form onSubmit={handleMovieFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Movie Title *</label>
                  <input 
                    type="text" 
                    required 
                    className="search-input" 
                    style={{ width: '100%' }}
                    value={movieFormData.title}
                    onChange={e => setMovieFormData({ ...movieFormData, title: e.target.value })}
                    placeholder="e.g. Gladiator II"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Genre</label>
                    <input 
                      type="text" 
                      className="search-input" 
                      style={{ width: '100%' }}
                      value={movieFormData.genre}
                      onChange={e => setMovieFormData({ ...movieFormData, genre: e.target.value })}
                      placeholder="e.g. Action • Drama • Epic"
                    />
                  </div>
                  <div>
                    <label className="form-label">Language(s)</label>
                    <input 
                      type="text" 
                      className="search-input" 
                      style={{ width: '100%' }}
                      value={movieFormData.language}
                      onChange={e => setMovieFormData({ ...movieFormData, language: e.target.value })}
                      placeholder="e.g. English, Hindi, Telugu"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Runtime (Mins)</label>
                    <input 
                      type="number" 
                      required 
                      className="search-input" 
                      style={{ width: '100%' }}
                      value={movieFormData.durationMinutes}
                      onChange={e => setMovieFormData({ ...movieFormData, durationMinutes: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Certificate</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={movieFormData.certificate}
                      onChange={e => setMovieFormData({ ...movieFormData, certificate: e.target.value })}
                    >
                      <option value="U (Universal)">U (Universal)</option>
                      <option value="UA 13+">UA 13+</option>
                      <option value="UA 16+">UA 16+</option>
                      <option value="A (18+)">A (18+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Rating Score (1-10)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="1" 
                      max="10" 
                      className="search-input" 
                      style={{ width: '100%' }}
                      value={movieFormData.ratingScore}
                      onChange={e => setMovieFormData({ ...movieFormData, ratingScore: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Synopsis</label>
                  <textarea 
                    rows={3} 
                    className="search-input" 
                    style={{ width: '100%', resize: 'vertical' }}
                    value={movieFormData.synopsis}
                    onChange={e => setMovieFormData({ ...movieFormData, synopsis: e.target.value })}
                    placeholder="Brief movie plot summary..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Supported Formats (Comma-separated)</label>
                    <input 
                      type="text" 
                      className="search-input" 
                      style={{ width: '100%' }}
                      value={movieFormData.formatsText}
                      onChange={e => setMovieFormData({ ...movieFormData, formatsText: e.target.value })}
                      placeholder="IMAX 2D, 4DX, Dolby Atmos, 2D"
                    />
                  </div>
                  <div>
                    <label className="form-label">Tags (Comma-separated)</label>
                    <input 
                      type="text" 
                      className="search-input" 
                      style={{ width: '100%' }}
                      value={movieFormData.tagsText}
                      onChange={e => setMovieFormData({ ...movieFormData, tagsText: e.target.value })}
                      placeholder="Trending #1, Bestseller"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Poster Image URL</label>
                  <input 
                    type="url" 
                    className="search-input" 
                    style={{ width: '100%' }}
                    value={movieFormData.posterUrl}
                    onChange={e => setMovieFormData({ ...movieFormData, posterUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowAddMovieModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  {editingMovie ? 'Save Movie Changes' : 'Create Movie Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHOWTIME */}
      {showAddShowModal && (
        <div className="modal-backdrop" onClick={() => setShowAddShowModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Schedule New Multiplex Showtime</div>
              <button type="button" className="btn-secondary-action" onClick={() => setShowAddShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddShowSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Feature Movie</label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={newShowData.movieId}
                    onChange={e => setNewShowData({ ...newShowData, movieId: e.target.value })}
                  >
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.certificate})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">State</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={newShowData.state}
                      onChange={e => {
                        const stateObj = LOCATIONS.find(l => l.state === e.target.value);
                        const firstCity = stateObj?.cities[0]?.city || '';
                        const firstTheatre = stateObj?.cities[0]?.theatres[0] || '';
                        setNewShowData({ 
                          ...newShowData, 
                          state: e.target.value, 
                          city: firstCity, 
                          theatre: firstTheatre 
                        });
                      }}
                    >
                      {LOCATIONS.map(l => (
                        <option key={l.state} value={l.state}>{l.state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">City</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={newShowData.city}
                      onChange={e => {
                        const stateObj = LOCATIONS.find(l => l.state === newShowData.state);
                        const cityObj = stateObj?.cities.find(c => c.city === e.target.value);
                        const firstTheatre = cityObj?.theatres[0] || '';
                        setNewShowData({ 
                          ...newShowData, 
                          city: e.target.value, 
                          theatre: firstTheatre 
                        });
                      }}
                    >
                      {LOCATIONS.find(l => l.state === newShowData.state)?.cities.map(c => (
                        <option key={c.city} value={c.city}>{c.city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Theatre Venue</label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={newShowData.theatre}
                    onChange={e => setNewShowData({ ...newShowData, theatre: e.target.value })}
                  >
                    {LOCATIONS.find(l => l.state === newShowData.state)?.cities.find(c => c.city === newShowData.city)?.theatres.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Screen Name</label>
                    <input 
                      type="text" 
                      className="search-input"
                      style={{ width: '100%' }}
                      value={newShowData.screen}
                      onChange={e => setNewShowData({ ...newShowData, screen: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Format (e.g. IMAX / 4DX / 2D)</label>
                    <input 
                      type="text" 
                      className="search-input"
                      style={{ width: '100%' }}
                      value={newShowData.format}
                      onChange={e => setNewShowData({ ...newShowData, format: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="search-input"
                      style={{ width: '100%' }}
                      value={newShowData.date}
                      onChange={e => setNewShowData({ ...newShowData, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Time</label>
                    <input 
                      type="time" 
                      className="search-input"
                      style={{ width: '100%' }}
                      value={newShowData.time}
                      onChange={e => setNewShowData({ ...newShowData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Total Auditorium Capacity</label>
                    <input 
                      type="number" 
                      className="search-input"
                      style={{ width: '100%' }}
                      value={newShowData.totalCapacity}
                      onChange={e => setNewShowData({ 
                        ...newShowData, 
                        totalCapacity: parseInt(e.target.value, 10),
                        seatsRemaining: parseInt(e.target.value, 10)
                      })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Base Ticket Price (INR)</label>
                    <input 
                      type="number" 
                      className="search-input"
                      style={{ width: '100%' }}
                      value={newShowData.basePrice}
                      onChange={e => setNewShowData({ ...newShowData, basePrice: parseFloat(e.target.value) || 250 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowAddShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  Schedule Showtime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
