export const STORY_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const STORY_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export const NOTIFICATION_TYPES = {
  TURN_START: 'turn_start',
  VOTE_OPEN: 'vote_open',
  STORY_COMPLETED: 'story_completed',
  CONTRIBUTION_ACCEPTED: 'contribution_accepted',
} as const;

export const MAX_CONTRIBUTIONS_DEFAULT = 10;
export const TURN_DURATION_DEFAULT = 5; // minutes
export const MIN_PASSWORD_LENGTH = 6;
