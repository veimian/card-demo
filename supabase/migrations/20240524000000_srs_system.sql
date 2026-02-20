-- Add Spaced Repetition System (SRS) columns to cards table
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS interval REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ease_factor REAL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create index for faster queries of due cards
CREATE INDEX IF NOT EXISTS idx_cards_next_review ON public.cards(next_review);
CREATE INDEX IF NOT EXISTS idx_cards_review_count ON public.cards(review_count);

-- Add comments for documentation
COMMENT ON COLUMN public.cards.next_review IS 'The next scheduled review date for this card';
COMMENT ON COLUMN public.cards.interval IS 'The current interval in days until the next review';
COMMENT ON COLUMN public.cards.ease_factor IS 'The easiness factor (EF) used in the SM-2 algorithm';
COMMENT ON COLUMN public.cards.review_count IS 'Total number of times this card has been reviewed';
