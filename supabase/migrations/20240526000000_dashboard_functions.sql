-- Function to get daily review stats for the last N days
CREATE OR REPLACE FUNCTION public.get_daily_review_stats(query_user_id UUID, start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  date TEXT,
  reviews INTEGER,
  new_cards INTEGER,
  retention_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(start_date::date, CURRENT_DATE, '1 day'::interval)::date as day
  ),
  daily_reviews AS (
    SELECT 
      review_date::date as day,
      COUNT(*)::integer as count,
      AVG(CASE WHEN rating >= 4 THEN 1.0 ELSE 0.0 END) * 100 as retention
    FROM review_logs
    WHERE user_id = query_user_id AND review_date >= start_date
    GROUP BY review_date::date
  ),
  daily_new_cards AS (
    SELECT 
      created_at::date as day,
      COUNT(*)::integer as count
    FROM cards
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category statistics
CREATE OR REPLACE FUNCTION public.get_category_statistics(query_user_id UUID)
RETURNS TABLE (
  name TEXT,
  count INTEGER,
  due_count INTEGER,
  average_retention NUMERIC,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name::TEXT,
    COUNT(DISTINCT card.id)::INTEGER as count,
    COUNT(DISTINCT CASE WHEN card.next_review <= NOW() THEN card.id END)::INTEGER as due_count,
    COALESCE(AVG(CASE WHEN rl.rating >= 4 THEN 100.0 ELSE 0.0 END), 0)::NUMERIC as average_retention,
    COALESCE(c.color, '#3b82f6')::TEXT as color
  FROM categories c
  LEFT JOIN cards card ON c.id = card.category_id
  LEFT JOIN review_logs rl ON card.id = rl.card_id AND rl.user_id = query_user_id
  WHERE c.user_id = query_user_id
  GROUP BY c.id, c.name, c.color
  HAVING COUNT(card.id) > 0
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get hourly review patterns
CREATE OR REPLACE FUNCTION public.get_hourly_review_patterns(query_user_id UUID, user_timezone TEXT DEFAULT 'UTC')
RETURNS TABLE (
  hour INTEGER,
  count INTEGER,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM review_date AT TIME ZONE 'UTC' AT TIME ZONE user_timezone)::INTEGER as hour,
    COUNT(*)::INTEGER as count,
    AVG(rating)::NUMERIC as avg_rating
  FROM review_logs
  WHERE user_id = query_user_id
  GROUP BY hour
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
