import React from 'react';
import { useCaseContext } from '../../context/CaseContext';
import { IconSLAClock } from '../common/Icons';

export function SLATimeTravel({ onClose }) {
  const { 
    timeOffsetMinutes, 
    simulatedNow, 
    advanceSimulatedTime, 
    resetSimulatedTime,
    metrics 
  } = useCaseContext();

  const currentTimeStr = new Date(simulatedNow).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSLAClock size={18} />
            <span>SLA Time-Travel Simulator</span>
          </div>
          <button type="button" className="btn-secondary-action" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Advance the simulated operational clock to verify how SLA countdowns, urgency badges, and work queue priorities dynamically escalate from <strong>On Track</strong> to <strong>Approaching Goal (&lt;6h)</strong> to <strong>Goal Breached (24h)</strong> and <strong>Deadline Breached (48h)</strong>.
          </p>

          <div style={{ background: 'var(--bg-inset)', padding: '12px 16px', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Current Simulated Operations Clock
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: '700', color: 'var(--amber-500)' }}>
              {currentTimeStr}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Offset: +{Math.floor(timeOffsetMinutes / 60)} hours {timeOffsetMinutes % 60} minutes
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="metric-card accent-amber">
              <span className="metric-label">At-Risk Cases (&lt;6h Goal)</span>
              <span className="metric-val">{metrics.atRiskCount}</span>
            </div>
            <div className="metric-card accent-danger">
              <span className="metric-label">Breached Cases (&gt;24h / &gt;48h)</span>
              <span className="metric-val">{metrics.breachedCount}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Fast-Forward Controls
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ justifyContent: 'center' }}
                onClick={() => advanceSimulatedTime(6)}
              >
                +6 Hours
              </button>
              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ justifyContent: 'center' }}
                onClick={() => advanceSimulatedTime(12)}
              >
                +12 Hours
              </button>
              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ justifyContent: 'center' }}
                onClick={() => advanceSimulatedTime(24)}
              >
                +24 Hours
              </button>
              <button 
                type="button" 
                className="btn-secondary-action"
                style={{ justifyContent: 'center' }}
                onClick={() => advanceSimulatedTime(48)}
              >
                +48 Hours
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-cancel-action"
            onClick={() => {
              resetSimulatedTime();
            }}
          >
            Reset to Real Time (0h offset)
          </button>
          <button type="button" className="btn-primary-action" onClick={onClose}>
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
