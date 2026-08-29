import React from 'react';
import { calculateSLA, SLA_STATES } from '../../utils/slaCalculator';
import { IconSLAClock } from './Icons';

export function SLABadge({ caseItem, simulatedNow, variant = 'compact' }) {
  const sla = calculateSLA(caseItem, simulatedNow);
  if (!sla) return null;

  if (sla.isResolved) {
    return (
      <span className="sla-badge sla-resolved">
        <span className="sla-dot sla-dot-green" />
        <span className="sla-text">{sla.label}</span>
      </span>
    );
  }

  let colorClass = 'sla-on-track';
  if (sla.state === SLA_STATES.DEADLINE_BREACHED) {
    colorClass = 'sla-deadline-breached';
  } else if (sla.state === SLA_STATES.GOAL_BREACHED) {
    colorClass = 'sla-goal-breached';
  } else if (sla.state === SLA_STATES.APPROACHING_GOAL) {
    colorClass = 'sla-approaching-goal';
  }

  if (variant === 'compact') {
    return (
      <span className={`sla-badge ${colorClass}`} title={`SLA State: ${sla.state}`}>
        <IconSLAClock size={12} className="sla-icon" />
        <span className="sla-text">{sla.label}</span>
      </span>
    );
  }

  // Detailed view with Goal / Deadline timestamps & progress meter
  return (
    <div className={`sla-detail-card ${colorClass}`}>
      <div className="sla-detail-header">
        <div className="sla-detail-title">
          <IconSLAClock size={16} />
          <span>SLA Urgency Monitor</span>
        </div>
        <span className={`sla-pill ${colorClass}`}>{sla.label}</span>
      </div>

      <div className="sla-progress-track">
        <div 
          className="sla-progress-fill" 
          style={{ width: `${sla.elapsedPercentage}%` }} 
        />
        {/* 50% marker = 24h Goal */}
        <div className="sla-goal-marker" title="24h Goal Threshold">
          <span className="marker-label">24h Goal</span>
        </div>
      </div>

      <div className="sla-detail-grid">
        <div className="sla-stat">
          <span className="stat-label">Goal (24h)</span>
          <span className={`stat-value ${sla.diffGoalMs < 0 ? 'text-danger' : ''}`}>
            {sla.timeToGoalFormatted}
          </span>
        </div>
        <div className="sla-stat">
          <span className="stat-label">Deadline (48h)</span>
          <span className={`stat-value ${sla.diffDeadlineMs < 0 ? 'text-critical' : ''}`}>
            {sla.timeToDeadlineFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
