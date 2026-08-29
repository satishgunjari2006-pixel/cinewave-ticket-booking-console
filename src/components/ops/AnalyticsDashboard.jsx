import React from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { formatINR } from '../../utils/costCalculator';
import { STATUSES, LOCATIONS } from '../../data/types';

export function AnalyticsDashboard() {
  const { cases, shows, movies, metrics, simulatedNow } = useCaseContext();

  const confirmedCases = cases.filter(c => c.status === STATUSES.RESOLVED_CONFIRMED);
  const totalRevenue = confirmedCases.reduce((sum, c) => sum + (c.totalCost || 0), 0);
  const totalTicketsSold = confirmedCases.reduce((sum, c) => sum + (c.seatCount || 0), 0);

  // Revenue by City
  const cityRevenue = LOCATIONS.map(loc => {
    const city = loc.cities[0].city;
    const cityShows = shows.filter(s => s.city === city);
    const cityShowIds = cityShows.map(s => s.id);
    const cityCases = confirmedCases.filter(c => cityShowIds.includes(c.showId));
    const revenue = cityCases.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const totalCap = cityShows.reduce((sum, s) => sum + s.totalCapacity, 0) || 1;
    const totalRemaining = cityShows.reduce((sum, s) => sum + s.seatsRemaining, 0);
    const occupancyPct = Math.round(((totalCap - totalRemaining) / totalCap) * 100);

    return {
      state: loc.state,
      city,
      theatres: loc.cities[0].theatres.length,
      revenue,
      occupancyPct: Math.max(0, Math.min(100, occupancyPct)),
      casesCount: cityCases.length,
    };
  });

  // Movie Box Office Leaderboard
  const movieLeaderboard = movies.map(m => {
    const mShows = shows.filter(s => s.movieId === m.id);
    const mShowIds = mShows.map(s => s.id);
    const mCases = confirmedCases.filter(c => mShowIds.includes(c.showId));
    const revenue = mCases.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const tickets = mCases.reduce((sum, c) => sum + (c.seatCount || 0), 0);

    return {
      id: m.id,
      title: m.title,
      certificate: m.certificate,
      rating: m.ratingScore,
      posterUrl: m.posterUrl,
      revenue,
      tickets,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Case ID', 'Customer Name', 'Email', 'Phone', 'Show ID', 'Seats', 'Category', 'Total Cost (INR)', 'Status', 'Queue', 'Created At'];
    const rows = cases.map(c => [
      c.caseId,
      `"${c.customerName}"`,
      c.customerEmail,
      c.customerPhone,
      c.showId,
      `"${c.selectedSeats?.join(', ') || ''}"`,
      c.seatCategory,
      c.totalCost,
      c.status,
      `"${c.queue}"`,
      c.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cinewave_box_office_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ops-container analytics-container">
      {/* Header with Export */}
      <div className="table-header-bar" style={{ borderRadius: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', padding: '18px 24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', color: '#fff' }}>
            📊 Indian Multiplex Box Office Analytics & Occupancy Hub
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Executive revenue breakdown, circuit occupancy rates, movie performance, and SLA compliance metrics.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary-action"
          onClick={handleExportCSV}
        >
          📥 Export Box Office CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metrics-strip">
        <div className="metric-card accent-crimson">
          <span className="metric-label">Gross Box Office Collections</span>
          <div className="metric-value-row">
            <span className="metric-val" style={{ color: 'var(--amber-500)' }}>{formatINR(totalRevenue)}</span>
          </div>
          <span className="metric-sub">{confirmedCases.length} Confirmed Orders</span>
        </div>

        <div className="metric-card accent-indigo">
          <span className="metric-label">Total Admissions Sold</span>
          <div className="metric-value-row">
            <span className="metric-val">{totalTicketsSold}</span>
          </div>
          <span className="metric-sub">Across 4 Metro Circuits</span>
        </div>

        <div className="metric-card accent-emerald">
          <span className="metric-label">SLA Compliance Rate</span>
          <div className="metric-value-row">
            <span className="metric-val">94.2%</span>
          </div>
          <span className="metric-sub">&lt; 24h Goal Resolution</span>
        </div>

        <div className="metric-card accent-amber">
          <span className="metric-label">Active Work Items</span>
          <div className="metric-value-row">
            <span className="metric-val">{metrics.activeCases}</span>
          </div>
          <span className="metric-sub">{metrics.atRiskCount} Approaching Goal</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Left: Circuit Occupancy */}
        <div className="analytics-card">
          <div className="card-heading">Multiplex Circuit Occupancy & Revenue by Metro</div>
          <p className="card-sub">Real-time seat filling rates and gross revenue across Indian regions.</p>

          <div className="city-analytics-list">
            {cityRevenue.map(c => (
              <div key={c.city} className="city-stat-block">
                <div className="city-stat-header">
                  <div>
                    <span className="city-stat-name">{c.city}</span>
                    <span className="city-stat-state">({c.state} • {c.theatres} Multiplexes)</span>
                  </div>
                  <div className="city-stat-rev">{formatINR(c.revenue)}</div>
                </div>

                <div className="occupancy-bar-track">
                  <div 
                    className="occupancy-bar-fill"
                    style={{ width: `${Math.max(8, c.occupancyPct)}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Occupancy: <strong>{c.occupancyPct}%</strong></span>
                  <span>{c.casesCount} Bookings Dispatched</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Feature Movie Leaderboard */}
        <div className="analytics-card">
          <div className="card-heading">Feature Film Box Office Performance</div>
          <p className="card-sub">Top grossing titles across cinema circuits.</p>

          <div className="movie-leaderboard-list">
            {movieLeaderboard.map((m, idx) => (
              <div key={m.id} className="leaderboard-item">
                <div className="leaderboard-rank">#{idx + 1}</div>
                <img src={m.posterUrl} alt={m.title} className="leaderboard-poster" />
                <div className="leaderboard-info">
                  <div className="leaderboard-title">{m.title}</div>
                  <div className="leaderboard-meta">★ {m.rating}/10 • {m.certificate} • {m.tickets} Tickets Sold</div>
                </div>
                <div className="leaderboard-rev">
                  {formatINR(m.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
