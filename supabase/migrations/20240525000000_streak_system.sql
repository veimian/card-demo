-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    last_review_date DATE,
    daily_goal INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_logs table
CREATE TABLE IF NOT EXISTS public.review_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent INTEGER -- seconds
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON public.user_stats
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_stats
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policies for review_logs
CREATE POLICY "Users can view own logs" ON public.review_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.review_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_logs_user_date ON public.review_logs(user_id, review_date);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_id ON public.review_logs(card_id);

-- Function to update updated_at on user_stats
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_stats_updated
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
