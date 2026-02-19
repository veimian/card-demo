-- 1. Add sharing fields to cards table
ALTER TABLE public.cards 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN share_token UUID DEFAULT uuid_generate_v4();

-- Create index for faster lookups by share_token
CREATE INDEX idx_cards_share_token ON public.cards(share_token);
CREATE INDEX idx_cards_is_public ON public.cards(is_public);

-- 2. Create comments table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for comments
CREATE INDEX idx_comments_card_id ON public.comments(card_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- 3. Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 4. Update RLS Policies

-- Cards: Allow public read access if is_public is true
CREATE POLICY "Public can view shared cards" ON public.cards
    FOR SELECT
    USING (is_public = true);

-- Comments: 
-- Allow viewing comments if the card is visible (either owned or public)
CREATE POLICY "View comments on visible cards" ON public.comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = comments.card_id
            AND (cards.user_id = auth.uid() OR cards.is_public = true)
        )
    );

-- Allow authenticated users to comment on visible cards
CREATE POLICY "Authenticated users can comment" ON public.comments
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = comments.card_id
            AND (cards.user_id = auth.uid() OR cards.is_public = true)
        )
    );

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Allow card owners to delete any comment on their card
CREATE POLICY "Card owners can delete comments" ON public.comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = comments.card_id
            AND cards.user_id = auth.uid()
        )
    );

-- 5. Grant permissions
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
