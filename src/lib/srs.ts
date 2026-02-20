export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

// SuperMemo-2 Algorithm
export interface CardSRS {
  next_review: string; // ISO Date string
  interval: number;    // Days
  ease_factor: number;
  review_count: number;
}

export const initialSRSState: CardSRS = {
  next_review: new Date().toISOString(),
  interval: 0,
  ease_factor: 2.5,
  review_count: 0,
};

/**
 * Calculate next review schedule based on SM-2 algorithm
 * @param currentInterval Current interval in days
 * @param currentEaseFactor Current ease factor (minimum 1.3)
 * @param rating Quality of response (0-5)
 * @param reviewCount Number of times reviewed so far
 */
export function calculateNextReview(
  currentInterval: number,
  currentEaseFactor: number,
  rating: Rating,
  reviewCount: number
): CardSRS {
  let nextInterval: number;
  let nextEaseFactor: number;

  // Correct response (rating >= 3)
  if (rating >= 3) {
    if (reviewCount === 0) {
      nextInterval = 1;
    } else if (reviewCount === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * currentEaseFactor);
    }

    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    nextEaseFactor = currentEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;
  } else {
    // Incorrect response
    nextInterval = 1;
    nextEaseFactor = currentEaseFactor; // EF doesn't change on failure in some variations, or decreases
    // In standard SM-2, EF doesn't change if q < 3, but the interval resets.
    // However, some implementations decrease EF. Let's stick to standard: reset interval.
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    next_review: nextReviewDate.toISOString(),
    interval: nextInterval,
    ease_factor: nextEaseFactor,
    review_count: rating >= 3 ? reviewCount + 1 : 0, // Reset count on failure? SM-2 usually resets interval but keeps track of "repetitions" as successful ones. 
    // Let's reset repetition count on failure to restart the learning phase (1 -> 6 -> ...)
  };
}

export const RATING_DESCRIPTIONS = {
  0: '完全忘记',
  1: '错误',
  2: '困难',
  3: '一般',
  4: '良好',
  5: '简单',
};
