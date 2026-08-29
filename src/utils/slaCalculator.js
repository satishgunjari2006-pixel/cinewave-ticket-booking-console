import { SLA_GOAL_HOURS, SLA_DEADLINE_HOURS, STATUSES } from '../data/types';

export const SLA_STATES = {
  ON_TRACK: 'ON_TRACK',
  APPROACHING_GOAL: 'APPROACHING_GOAL',
  GOAL_BREACHED: 'GOAL_BREACHED',
  APPROACHING_DEADLINE: 'APPROACHING_DEADLINE',
  DEADLINE_BREACHED: 'DEADLINE_BREACHED',
  RESOLVED: 'RESOLVED',
};

/**
 * Calculates current SLA status and time diffs for a case based on simulated clock
 */
export function calculateSLA(caseItem, simulatedNow = Date.now()) {
  if (!caseItem) return null;

  const isResolved = caseItem.status === STATUSES.RESOLVED_CONFIRMED || caseItem.status === STATUSES.RESOLVED_CANCELLED;
  
  const createdTime = new Date(caseItem.createdAt).getTime();
  const goalTime = caseItem.slaGoalAt 
    ? new Date(caseItem.slaGoalAt).getTime() 
    : createdTime + (SLA_GOAL_HOURS * 3600 * 1000);
  const deadlineTime = caseItem.slaDeadlineAt 
    ? new Date(caseItem.slaDeadlineAt).getTime() 
    : createdTime + (SLA_DEADLINE_HOURS * 3600 * 1000);

  if (isResolved) {
    const resolvedTime = caseItem.resolvedAt ? new Date(caseItem.resolvedAt).getTime() : simulatedNow;
    const metGoal = resolvedTime <= goalTime;
    const metDeadline = resolvedTime <= deadlineTime;

    return {
      state: SLA_STATES.RESOLVED,
      isResolved: true,
      metGoal,
      metDeadline,
      label: metGoal ? 'SLA Met (Within Goal)' : metDeadline ? 'Resolved (Within Deadline)' : 'Resolved (Post-Deadline)',
      urgencyLevel: 'resolved',
      timeToGoalFormatted: 'Met in ' + formatDuration(resolvedTime - createdTime),
      timeToDeadlineFormatted: '',
      remainingPercentage: 100,
    };
  }

  const diffGoalMs = goalTime - simulatedNow;
  const diffDeadlineMs = deadlineTime - simulatedNow;

  let state = SLA_STATES.ON_TRACK;
  let label = '';
  let urgencyLevel = 'normal'; // normal, warning, danger, critical

  if (diffDeadlineMs <= 0) {
    state = SLA_STATES.DEADLINE_BREACHED;
    urgencyLevel = 'critical';
    label = `Deadline Breached (${formatDuration(Math.abs(diffDeadlineMs))} ago)`;
  } else if (diffGoalMs <= 0) {
    state = SLA_STATES.GOAL_BREACHED;
    urgencyLevel = 'danger';
    const remainingToDeadline = formatDuration(diffDeadlineMs);
    label = `Goal Breached • ${remainingToDeadline} to Deadline`;
  } else if (diffGoalMs <= 6 * 3600 * 1000) {
    // Within 6 hours of Goal
    state = SLA_STATES.APPROACHING_GOAL;
    urgencyLevel = 'warning';
    label = `Goal in ${formatDuration(diffGoalMs)}`;
  } else {
    state = SLA_STATES.ON_TRACK;
    urgencyLevel = 'normal';
    label = `Goal in ${formatDuration(diffGoalMs)}`;
  }

  // Calculate percentage of 48h SLA elapsed
  const totalDuration = SLA_DEADLINE_HOURS * 3600 * 1000;
  const elapsed = Math.max(0, simulatedNow - createdTime);
  const elapsedPercentage = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  return {
    state,
    isResolved: false,
    label,
    urgencyLevel,
    diffGoalMs,
    diffDeadlineMs,
    goalTime,
    deadlineTime,
    timeToGoalFormatted: diffGoalMs > 0 ? `${formatDuration(diffGoalMs)} left` : `Breached by ${formatDuration(Math.abs(diffGoalMs))}`,
    timeToDeadlineFormatted: diffDeadlineMs > 0 ? `${formatDuration(diffDeadlineMs)} left` : `Breached by ${formatDuration(Math.abs(diffDeadlineMs))}`,
    elapsedPercentage,
  };
}

function formatDuration(ms) {
  if (isNaN(ms) || ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
