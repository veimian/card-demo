import { Rating } from './srs';

export interface EnhancedSRSConfig {
  minInterval: number;        // Minimum interval in days
  maxInterval: number;        // Maximum interval in days
  initialEaseFactor: number;    // Default ease factor
  intervalModifier: number;     // Multiplier for interval growth
  fuzzing: boolean;             // Whether to add random fuzz to intervals
}

export const DEFAULT_SRS_CONFIG: EnhancedSRSConfig = {
  minInterval: 1,
  maxInterval: 365,
  initialEaseFactor: 2.5,
  intervalModifier: 1.0,
  fuzzing: true,
};

export interface CardSRS {
  next_review: string; // ISO Date string
  interval: number;    // Days
  ease_factor: number;
  review_count: number;
}

/**
 * Enhanced SRS Algorithm based on SM-2 with improvements
 */
export function calculateNextReviewEnhanced(
  currentInterval: number,
  currentEaseFactor: number,
  rating: Rating,
  reviewCount: number,
  config: EnhancedSRSConfig = DEFAULT_SRS_CONFIG
): CardSRS {
  let nextInterval: number;
  let nextEaseFactor: number;
  
  // Quality response (0-5)
  // 3-5: Correct
  // 0-2: Incorrect
  
  if (rating >= 3) {
    if (reviewCount === 0) {
      nextInterval = 1;
    } else if (reviewCount === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * currentEaseFactor * config.intervalModifier);
    }

    // Update Ease Factor
    // Standard SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    nextEaseFactor = currentEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  } else {
    // Incorrect response
    nextInterval = 1; // Reset interval
    // Standard SM-2 doesn't change EF on failure, but some variants decrease it.
    // Let's decrease slightly to account for difficulty
    nextEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
  }

  // Apply constraints
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;
  if (nextInterval < config.minInterval) nextInterval = config.minInterval;
  if (nextInterval > config.maxInterval) nextInterval = config.maxInterval;

  // Apply fuzzing (small random variation to prevent stacking)
  // Only apply for intervals > 4 days
  if (config.fuzzing && nextInterval > 4) {
    const fuzz = Math.random() * 0.1 - 0.05; // +/- 5%
    nextInterval = Math.round(nextInterval * (1 + fuzz));
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
  
  // Set time to specific hour? Or just keep current time + days?
  // Usually setting to start of day or specific review time is better, but let's keep it simple: exact time.

  return {
    next_review: nextReviewDate.toISOString(),
    interval: nextInterval,
    ease_factor: nextEaseFactor,
    review_count: rating >= 3 ? reviewCount + 1 : 0, // Reset review count on failure to restart "learning phase" logic (1 -> 6 -> ...)
  };
}
