-- Harden settings, shared tokens, comments, and dashboard RPC access.

-- Ensure legacy/imported cards can always produce a share link.
UPDATE public.cards
SET share_token = uuid_generate_v4()
WHERE share_token IS NULL;

ALTER TABLE public.cards
ALTER COLUMN share_token SET DEFAULT uuid_generate_v4();

CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_share_token_unique
ON public.cards(share_token)
WHERE share_token IS NOT NULL;

-- The shared DeepSeek key must not be readable by every authenticated user.
DROP POLICY IF EXISTS "Allow authenticated read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin read system settings" ON public.system_settings;

CREATE POLICY "Allow admin read system settings" ON public.system_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Comments must be attributed to the authenticated user, not a client-provided id.
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;

CREATE POLICY "Authenticated users can comment" ON public.comments
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = comments.card_id
            AND (cards.user_id = auth.uid() OR cards.is_public = true)
        )
    );

-- Dashboard RPCs run as SECURITY DEFINER, so explicitly restrict them to auth.uid().
CREATE OR REPLACE FUNCTION public.get_daily_review_stats(query_user_id UUID, start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  date TEXT,
  reviews INTEGER,
  new_cards INTEGER,
  retention_rate NUMERIC
) AS $$
BEGIN
  IF query_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed to query another user''s review stats';
  END IF;

  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(start_date::date, CURRENT_DATE, '1 day'::interval)::date as day
  ),
  daily_reviews AS (
    SELECT
      review_date::date as day,
      COUNT(*)::integer as count,
      AVG(CASE WHEN rating >= 4 THEN 1.0 ELSE 0.0 END) * 100 as retention
    FROM public.review_logs
    WHERE user_id = query_user_id AND review_date >= start_date
    GROUP BY review_date::date
  ),
  daily_new_cards AS (
    SELECT
      created_at::date as day,
      COUNT(*)::integer as count
    FROM public.cards
    WHERE user_id = query_user_id AND created_at >= start_date
    GROUP BY created_at::date
  )
  SELECT
    to_char(d.day, 'YYYY-MM-DD') as date,
    COALESCE(dr.count, 0) as reviews,
    COALESCE(dnc.count, 0) as new_cards,
    COALESCE(dr.retention, 0) as retention_rate
  FROM dates d
  LEFT JOIN daily_reviews dr ON d.day = dr.day
  LEFT JOIN daily_new_cards dnc ON d.day = dnc.day
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_category_statistics(query_user_id UUID)
RETURNS TABLE (
  name TEXT,
  count INTEGER,
  due_count INTEGER,
  average_retention NUMERIC,
  color TEXT
) AS $$
BEGIN
  IF query_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed to query another user''s category stats';
  END IF;

  RETURN QUERY
  SELECT
    c.name::TEXT,
    COUNT(DISTINCT card.id)::INTEGER as count,
    COUNT(DISTINCT CASE WHEN card.next_review <= NOW() THEN card.id END)::INTEGER as due_count,
    COALESCE(AVG(CASE WHEN rl.rating >= 4 THEN 100.0 ELSE 0.0 END), 0)::NUMERIC as average_retention,
    COALESCE(c.color, '#3b82f6')::TEXT as color
  FROM public.categories c
  LEFT JOIN public.cards card ON c.id = card.category_id
  LEFT JOIN public.review_logs rl ON card.id = rl.card_id AND rl.user_id = query_user_id
  WHERE c.user_id = query_user_id
  GROUP BY c.id, c.name, c.color
  HAVING COUNT(card.id) > 0
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_hourly_review_patterns(query_user_id UUID, user_timezone TEXT DEFAULT 'UTC')
RETURNS TABLE (
  hour INTEGER,
  count INTEGER,
  avg_rating NUMERIC
) AS $$
BEGIN
  IF query_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed to query another user''s hourly stats';
  END IF;

  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM review_date AT TIME ZONE 'UTC' AT TIME ZONE user_timezone)::INTEGER as hour,
    COUNT(*)::INTEGER as count,
    AVG(rating)::NUMERIC as avg_rating
  FROM public.review_logs
  WHERE user_id = query_user_id
  GROUP BY hour
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
