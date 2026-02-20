import { supabase } from './supabase';

export interface SRSValidationReport {
  totalCards: number;
  invalidCards: number;
  fixedCards: number;
}

/**
 * Fixes SRS data for all cards of a user.
 * Ensures that interval, ease_factor, review_count, and next_review are not null.
 */
export async function fixDueCardCalculation(userId: string): Promise<SRSValidationReport> {
  // 1. Check for invalid cards
  const { count, error: countError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or('interval.is.null,ease_factor.is.null,review_count.is.null,next_review.is.null');

  if (countError) throw countError;

  const invalidCount = count || 0;

  if (invalidCount === 0) {
    return {
      totalCards: 0, // We didn't fetch total, just invalid
      invalidCards: 0,
      fixedCards: 0
    };
  }

  // 2. Update invalid cards
  // We set default values for SRS fields
  const updates = {
    interval: 0,
    ease_factor: 2.5,
    review_count: 0,
    next_review: new Date().toISOString() // Set due to now
  };

  const { error: updateError } = await supabase
    .from('cards')
    .update(updates)
    .eq('user_id', userId)
    .or('interval.is.null,ease_factor.is.null,review_count.is.null,next_review.is.null');

  if (updateError) throw updateError;

  return {
    totalCards: 0, // Placeholder
    invalidCards: invalidCount,
    fixedCards: invalidCount
  };
}

/**
 * Validates SRS consistency.
 * Checks if next_review is in the past but not reviewed (which is normal for due cards),
 * but maybe check for other anomalies like ease_factor < 1.3
 */
export async function validateSRSConsistency(userId: string): Promise<SRSValidationReport> {
  const { data: cards, error } = await supabase
    .from('cards')
    .select('id, interval, ease_factor')
    .eq('user_id', userId);

  if (error) throw error;
  if (!cards) return { totalCards: 0, invalidCards: 0, fixedCards: 0 };

  let invalidCount = 0;
  
  // Check for logical inconsistencies
  // e.g. ease_factor < 1.3
  const invalidIds = cards.filter(c => (c.ease_factor && c.ease_factor < 1.3)).map(c => c.id);
  
  if (invalidIds.length > 0) {
    // Fix ease factor
    await supabase
      .from('cards')
      .update({ ease_factor: 1.3 })
      .in('id', invalidIds);
      
    invalidCount = invalidIds.length;
  }

  return {
    totalCards: cards.length,
    invalidCards: invalidCount,
    fixedCards: invalidCount
  };
}
