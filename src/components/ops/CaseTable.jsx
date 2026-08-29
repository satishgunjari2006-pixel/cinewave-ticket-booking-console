import React from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { StatusBadge, StageBadge, QueueBadge } from '../common/StatusBadge';
import { SLABadge } from '../common/SLABadge';
import { SEAT_CATEGORIES } from '../../data/types';
import { formatINR } from '../../utils/costCalculator';

export function CaseTable({ onOpenCase }) {
  const { 
    filteredCases, 
    selectedCaseId, 
    setSelectedCaseId, 
    getCaseEntities, 
    simulatedNow 
  } = useCaseContext();

  return (
    <div className="case-table-card">
      <div className="table-header-bar">
        <div className="table-title">
          <span>Active Case Work Queue</span>
          <span className="tab-badge">{filteredCases.length} records</span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click row or "Inspect Case" to open full case workspace
        </span>
      </div>

      <div className="table-scroll-wrap">
        {filteredCases.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>No cases match the active filter</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Try switching work queues or clearing search terms.</p>
          </div>
        ) : (
          <table className="case-data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Guest Information</th>
                <th>Feature & Location</th>
                <th>Queue Route</th>
                <th>Seats & Tier</th>
                <th>Total Cost (INR)</th>
                <th>SLA Urgency Monitor</th>
                <th>Stage & Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => {
                const isSelected = c.caseId === selectedCaseId;
                const { movie, show } = getCaseEntities(c);
                const categoryConfig = SEAT_CATEGORIES[c.seatCategory] || SEAT_CATEGORIES.STANDARD;

                return (
                  <tr 
                    key={c.caseId} 
                    className={`case-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCaseId(c.caseId);
                      if (onOpenCase) onOpenCase(c);
                    }}
                  >
                    <td className="case-id-cell">
                      {c.caseId}
                    </td>

                    <td>
                      <div className="customer-name-cell">{c.customerName}</div>
                      <div className="customer-sub-cell">{c.customerEmail} • {c.customerPhone}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: '#fff' }}>
                        {movie?.title || 'Unknown Title'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {show ? `${show.theatre} (${show.city}, ${show.state}) • ${show.time}` : 'Show Ref N/A'}
                      </div>
                    </td>

                    <td>
                      <QueueBadge queue={c.queue} />
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: '#fff' }}>
                        {c.seatCount} Seat{c.seatCount > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {categoryConfig.badge} ({c.selectedSeats?.join(', ')})
                      </div>
                    </td>

                    <td className="cost-cell">
                      {formatINR(c.totalCost)}
                    </td>

                    <td>
                      <SLABadge caseItem={c} simulatedNow={simulatedNow} variant="compact" />
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <StatusBadge status={c.status} size="sm" />
                        <StageBadge stage={c.stage} />
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-inspect-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCaseId(c.caseId);
                          if (onOpenCase) onOpenCase(c);
                        }}
                      >
                        Inspect Case →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
