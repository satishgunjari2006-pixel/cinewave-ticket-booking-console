import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { formatINR } from '../../utils/costCalculator';

export function ShowtimeSelector({ movieId, onSelectShow, onBack }) {
  const { movies, shows, selectedCity, selectedState } = useCaseContext();
  const [selectedDate, setSelectedDate] = useState('2026-08-28');

  const movie = movies.find(m => m.id === movieId) || movies[0];
  
  // Filter shows by Movie AND Selected City (with fallback to all shows if city has no matching listings)
  let movieCityShows = shows.filter(s => s.movieId === movieId && s.city?.toLowerCase() === selectedCity.toLowerCase());
  if (movieCityShows.length === 0) {
    movieCityShows = shows.filter(s => s.movieId === movieId);
  }

  // Group shows by Theatre
  const theatreGroups = movieCityShows.reduce((acc, show) => {
    if (!acc[show.theatre]) {
      acc[show.theatre] = {
        name: show.theatre,
        location: show.theatreLocation || `${show.city}, ${show.state}`,
        city: show.city,
        state: show.state,
        shows: [],
      };
    }
    acc[show.theatre].shows.push(show);
    return acc;
  }, {});

  const dates = [
    { dateStr: '2026-08-28', day: 'FRI', dayNum: '28', month: 'AUG' },
    { dateStr: '2026-08-29', day: 'SAT', dayNum: '29', month: 'AUG' },
    { dateStr: '2026-08-30', day: 'SUN', dayNum: '30', month: 'AUG' },
  ];

  return (
    <div className="showtime-selector-container">
      {/* 1. Movie Mini Banner */}
      <div className="movie-mini-banner">
        <button type="button" className="btn-back-link" onClick={onBack}>
          ← Back to Movies
        </button>

        <div className="mini-banner-content">
          <img src={movie.posterUrl} alt={movie.title} className="mini-poster-thumb" />
          <div>
            <div className="mini-meta-tags">
              <span className="badge-cert">{movie.certificate}</span>
              <span className="badge-rating">★ {movie.ratingScore}/10</span>
              <span className="meta-genre">{movie.genre}</span>
            </div>
            <h1 className="mini-movie-title">{movie.title}</h1>
            <div className="mini-runtime">
              {movie.language} • {movie.durationMinutes} mins • Screenings in <strong>{selectedCity}, {selectedState}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Date Strip */}
      <div className="date-strip-bar">
        <div className="dates-row">
          {dates.map(d => (
            <button
              key={d.dateStr}
              type="button"
              className={`date-pill-btn ${selectedDate === d.dateStr ? 'active' : ''}`}
              onClick={() => setSelectedDate(d.dateStr)}
            >
              <span className="date-day">{d.day}</span>
              <span className="date-number">{d.dayNum}</span>
              <span className="date-month">{d.month}</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="availability-legend">
          <div className="legend-item">
            <span className="status-dot dot-available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="status-dot dot-filling" />
            <span>Fast Filling</span>
          </div>
          <div className="legend-item">
            <span className="status-dot dot-almost-full" />
            <span>Almost Full</span>
          </div>
        </div>
      </div>

      {/* 3. Multiplex Listings Grouped by Theatre */}
      <div className="theatres-list">
        {Object.keys(theatreGroups).length === 0 ? (
          <div className="empty-shows-notice">
            <p>No scheduled screenings in {selectedCity} for this title today. Try selecting another city from the top bar.</p>
          </div>
        ) : (
          Object.values(theatreGroups).map(theatre => (
            <div key={theatre.name} className="theatre-card">
              <div className="theatre-header">
                <div className="theatre-title-wrap">
                  <span className="heart-icon">♥</span>
                  <div>
                    <h3 className="theatre-name">{theatre.name}</h3>
                    <div className="theatre-location">{theatre.location} ({theatre.city}, {theatre.state})</div>
                  </div>
                </div>

                <div className="theatre-amenities">
                  <span className="amenity-tag">📱 M-Ticket</span>
                  <span className="amenity-tag">🍿 Food & Beverage</span>
                  <span className="amenity-tag">♿ Wheelchair Accessible</span>
                </div>
              </div>

              {/* Showtimes Row */}
              <div className="showtimes-grid">
                {theatre.shows.map(show => {
                  let availClass = 'pill-available';
                  let availText = `${show.seatsRemaining} seats available`;

                  if (show.seatsRemaining <= 8) {
                    availClass = 'pill-almost-full';
                    availText = `Almost Full (${show.seatsRemaining} seats)`;
                  } else if (show.seatsRemaining <= 25) {
                    availClass = 'pill-filling-fast';
                    availText = `Fast Filling (${show.seatsRemaining} seats)`;
                  }

                  return (
                    <button
                      key={show.id}
                      type="button"
                      className={`showtime-pill ${availClass}`}
                      onClick={() => onSelectShow(show.id)}
                      title={`Show: ${show.time} - ${show.format || show.screen}\n${availText}\nPrice: From ${formatINR(show.basePrice, false)}`}
                    >
                      <div className="pill-time">{show.time}</div>
                      <div className="pill-format">{show.format || show.screen}</div>
                      <div className="pill-price">From {formatINR(show.basePrice, false)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
