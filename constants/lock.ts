/** Initial mandatory lock duration when a limit is hit */
export const INITIAL_LOCK_SECONDS = 30 * 60;

/** Floor — reading/learning cannot reduce lock below this remaining time */
export const MIN_LOCK_REMAINING_SECONDS = 5 * 60;

export const READ_REDUCE_SECONDS = 90;
export const LEARN_REDUCE_SECONDS = 60;
export const READ_UNLOCK_MINUTES = 15;
export const LEARN_UNLOCK_MINUTES = 15;
export const PENALTY_SECONDS = 120;
export const PAGE_COUNTDOWN_SECONDS = 10;
