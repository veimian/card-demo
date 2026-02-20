import { describe, it, expect } from 'vitest';
import { calculateNextReview, Rating } from '../lib/srs';

describe('SRS Algorithm (SM-2)', () => {
  it('should schedule new card for 1 day on correct answer', () => {
    const result = calculateNextReview(0, 2.5, 3, 0);
    expect(result.interval).toBe(1);
    expect(result.review_count).toBe(1);
  });

  it('should schedule card for 6 days on second correct answer', () => {
    const result = calculateNextReview(1, 2.5, 4, 1);
    expect(result.interval).toBe(6);
    expect(result.review_count).toBe(2);
  });

  it('should increase ease factor for easy answer', () => {
    const result = calculateNextReview(6, 2.5, 5, 2);
    // EF' = 2.5 + (0.1 - (5-5)*(...)) = 2.6
    expect(result.ease_factor).toBeGreaterThan(2.5);
    expect(result.interval).toBeGreaterThan(6);
  });

  it('should decrease ease factor for hard answer', () => {
    // Note: Our implementation might keep EF same or decrease slightly for rating 3 depending on exact formula
    // EF' = 2.5 + (0.1 - (5-3)*(0.08 + (5-3)*0.02)) 
    //    = 2.5 + (0.1 - 2 * (0.08 + 0.04))
    //    = 2.5 + (0.1 - 2 * 0.12)
    //    = 2.5 + (0.1 - 0.24)
    //    = 2.5 - 0.14 = 2.36
    const result = calculateNextReview(10, 2.5, 3, 5);
    expect(result.ease_factor).toBeCloseTo(2.36, 2);
  });

  it('should reset interval on incorrect answer', () => {
    const result = calculateNextReview(10, 2.5, 1, 5);
    expect(result.interval).toBe(1);
    expect(result.review_count).toBe(0); // Reset review count logic
  });

  it('should not let ease factor drop below 1.3', () => {
    const result = calculateNextReview(10, 1.3, 3, 5);
    expect(result.ease_factor).toBe(1.3);
  });
});
