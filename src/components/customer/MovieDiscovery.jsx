import React, { useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { formatINR } from '../../utils/costCalculator';

export function MovieDiscovery({ onSelectMovie }) {
  const { movies, selectedCity, selectedState } = useCaseContext();
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  const genres = ['ALL', 'Sci-Fi', 'Action', 'Drama', 'Romance', 'Animation'];

  const filteredMovies = selectedGenre === 'ALL'
    ? movies
    : movies.filter(m => m.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

  const featuredMovie = movies[0]; // Spotlight film

  return (
    <div className="discovery-container">
      {/* 1. Spotlight Feature Banner (Clean BookMyShow / District Hero) */}
      {featuredMovie && (
        <section className="spotlight-banner">
          <div 
            className="spotlight-bg"
            style={{ backgroundImage: `linear-gradient(to right, #090B10 32%, rgba(9, 11, 16, 0.75) 75%, transparent 100%), url(${featuredMovie.bannerUrl || featuredMovie.posterUrl})` }}
          />
          <div className="spotlight-content">
            <div className="spotlight-badge-row">
              <span className="badge-trending">⚡ TRENDING IN {selectedCity.toUpperCase()}</span>
              <span className="badge-cert">{featuredMovie.certificate}</span>
              <span className="badge-rating">★ {featuredMovie.ratingScore}/10 ({featuredMovie.votesCount})</span>
            </div>

            <h1 className="spotlight-title">{featuredMovie.title}</h1>
            
            <div className="spotlight-meta">
              <span>{featuredMovie.genre}</span>
              <span>•</span>
              <span>{featuredMovie.durationMinutes} mins</span>
              <span>•</span>
              <span>{featuredMovie.language}</span>
            </div>

            <p className="spotlight-synopsis">{featuredMovie.synopsis}</p>

            <div className="spotlight-formats">
              {featuredMovie.formats?.map((fmt, i) => (
                <span key={i} className="format-tag">{fmt}</span>
              ))}
            </div>

            <div className="spotlight-actions">
              <button 
                type="button" 
                className="btn-book-hero"
                onClick={() => onSelectMovie(featuredMovie.id)}
              >
                Book Tickets in {selectedCity}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Genre Filter Bar with Location Scope */}
      <div className="genre-filter-bar">
        <div className="section-heading">
          <h2>Now Showing in {selectedCity}</h2>
          <span className="section-sub">Explore latest releases across {selectedState} multiplexes</span>
        </div>

        <div className="genre-pills">
          {genres.map(g => (
            <button
              key={g}
              type="button"
              className={`genre-pill ${selectedGenre === g ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Movie Grid */}
      <div className="bms-movie-grid">
        {filteredMovies.map((movie) => (
          <div 
            key={movie.id} 
            className="bms-movie-card"
            onClick={() => onSelectMovie(movie.id)}
          >
            <div className="poster-wrapper">
              <img 
                src={movie.posterUrl} 
                alt={movie.title} 
                className="movie-poster-img"
                loading="lazy"
              />
              <div className="poster-gradient-overlay" />
              
              <div className="poster-rating-pill">
                <span className="star-icon">★</span>
                <span className="rating-score">{movie.ratingScore}</span>
                <span className="votes-sub">{movie.votesCount}</span>
              </div>

              <div className="poster-cert-pill">{movie.certificate}</div>
            </div>

            <div className="movie-card-info">
              <h3 className="movie-card-title">{movie.title}</h3>
              <div className="movie-card-genre">{movie.genre}</div>
              <div className="movie-card-formats">
                {movie.formats?.slice(0, 3).map((f, idx) => (
                  <span key={idx} className="mini-format-pill">{f}</span>
                ))}
              </div>

              <button 
                type="button" 
                className="btn-card-book"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMovie(movie.id);
                }}
              >
                Book Tickets
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
