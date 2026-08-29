import React from 'react';
import { STATUSES, STAGES } from '../../data/types';

export function StatusBadge({ status, size = 'md' }) {
  let badgeClass = 'status-badge-neutral';
  let dotClass = 'bg-slate-400';

  switch (status) {
    case STATUSES.NEW:
      badgeClass = 'status-badge-new';
      dotClass = 'bg-blue-400';
      break;
    case STATUSES.PENDING_AVAILABILITY:
      badgeClass = 'status-badge-availability';
      dotClass = 'bg-amber-400';
      break;
    case STATUSES.PENDING_APPROVAL:
      badgeClass = 'status-badge-approval';
      dotClass = 'bg-amber-500';
      break;
    case STATUSES.RESOLVED_CONFIRMED:
      badgeClass = 'status-badge-confirmed';
      dotClass = 'bg-emerald-400';
      break;
    case STATUSES.RESOLVED_CANCELLED:
      badgeClass = 'status-badge-cancelled';
      dotClass = 'bg-zinc-400';
      break;
    case STATUSES.RESOLVED_REFUNDED:
      badgeClass = 'status-badge-cancelled';
      dotClass = 'bg-purple-400';
      break;
    default:
      badgeClass = 'status-badge-neutral';
      dotClass = 'bg-slate-400';
  }

  return (
    <span className={`status-badge ${badgeClass} status-size-${size}`}>
      <span className={`status-dot ${dotClass}`} />
      <span className="status-label">{status || 'Unknown'}</span>
    </span>
  );
}

export function StageBadge({ stage, current = false }) {
  let stageNumber = '1';
  let shortName = 'Initial Stage';

  if (stage?.includes('Availability') || stage === 'AVAILABILITY') {
    stageNumber = '2';
    shortName = 'Availability';
  } else if (stage?.includes('Approval') || stage === 'APPROVAL') {
    stageNumber = '3';
    shortName = 'Approval';
  } else if (stage?.includes('Execution') || stage?.includes('Booking Execution') || stage === 'EXECUTION') {
    stageNumber = '4';
    shortName = 'Booking Execution';
  }

  return (
    <span className={`stage-badge ${current ? 'stage-badge-current' : ''}`}>
      <span className="stage-num">S{stageNumber}</span>
      <span className="stage-name">{shortName}</span>
    </span>
  );
}

export function QueueBadge({ queue }) {
  const isPremium = queue?.includes('Premium');
  return (
    <span className={`queue-badge ${isPremium ? 'queue-premium' : 'queue-standard'}`} title={isPremium ? 'Routed to Premium ShowQueue (IMAX / 4DX / Dolby / Luxe)' : 'Routed to Standard ShowQueue'}>
      <span className="queue-indicator" />
      {queue || 'Standard ShowQueue'}
    </span>
  );
}