-- Fix Tag Isolation: Only show tags that are used by the current user's cards

-- 1. Drop existing policies for tags
DROP POLICY IF EXISTS "Public read access tags" ON public.tags;
DROP POLICY IF EXISTS "Authenticated insert tags" ON public.tags;

-- 2. Create new policies for tags

-- Policy: Users can see tags that are associated with their own cards
CREATE POLICY "Users can view own tags" ON public.tags
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.card_tags ct
        JOIN public.cards c ON c.id = ct.card_id
        WHERE ct.tag_id = tags.id
        AND c.user_id = auth.uid()
    )
);

-- Policy: Users can insert tags (no restrictions on creation, deduplication handled by UNIQUE constraint)
CREATE POLICY "Users can insert tags" ON public.tags
FOR INSERT TO authenticated
WITH CHECK (true);

-- Note: The `card_tags` policies are already correct (based on card ownership), so we don't need to change them.
-- But the previous `tags` policy was `TO public USING (true)`, which allowed seeing ALL tags globally.
-- Now we restrict SELECT to only tags linked to the user's cards.

-- However, there is a UX issue: When creating a new card, users might want to search for existing tags.
-- If we only show tags used by *their* cards, they won't see global tags to reuse (which might be desired to keep tag database small).
-- But typically in a personal notes app, tags are private.
-- If the goal is "Private Tags", we should have `user_id` on `tags` table.
-- BUT, the current schema has a shared `tags` table (`id`, `name`).
-- If User A creates "React", and User B creates "React", it might conflict if `name` is UNIQUE globally.
-- Let's check the schema again.
-- `name VARCHAR(50) UNIQUE NOT NULL` -> Yes, global unique tags.

-- If the requirement is "Show only my tags", then we are filtering the VIEW of the shared tag pool.
-- But this means if User A uses "React", User B won't see "React" in their list until they also use it?
-- Or does it mean User B *cannot* see "React" at all?

-- If the user wants "Private Tags" (User A's "React" is different from User B's "React"), we need to change the schema.
-- But changing schema is heavy.
-- Let's assume the user just wants to FILTER the list to only show tags they have used before.
-- But for autocomplete, they might want to see what they have.

-- Let's apply the filtering policy first.

-- Wait, if I restrict SELECT on `tags`, then when creating a card, if I try to add a tag "NewTag", 
-- the frontend might check if it exists. If I can't see it (but someone else created it), 
-- I might try to INSERT it, and get a Unique Constraint Violation error.

-- BETTER APPROACH for "Private Tags" feeling with "Shared Tag" database:
-- 1. `tags` table remains global dictionary of strings.
-- 2. RLS on `tags` allows reading ALL tags (so autocomplete works / unique checks work).
-- 3. Frontend filtering: The UI should only list tags from `useTags()` query.
-- 4. The `useTags` query in the frontend currently fetches ALL tags?
--    Let's check `useTags` implementation.

-- Actually, if the user explicitly said "标签管理那里只展示自己账号有的" (Tag management only shows what my account has),
-- it implies the current list is showing EVERYONE's tags, which is messy.
-- So we should restrict the RLS for SELECT to only tags linked to user's cards.

-- But what about the Unique Constraint Violation?
-- If User A has "React", User B doesn't.
-- User B types "React".
-- Frontend checks if "React" exists. API returns nothing (because RLS hides it).
-- Frontend tries to INSERT "React".
-- Database throws Error: Duplicate key value violates unique constraint "tags_name_key".
-- This breaks the UX.

-- SOLUTION:
-- We need to handle `ON CONFLICT DO NOTHING` in the backend or frontend logic, 
-- OR we allow SELECT to everyone but filter in the UI? 
-- No, the user asked for "标签管理那里只展示自己账号有的" (Tag management... shows only mine).
-- This suggests the "Tag Management" page or list.

-- If we change RLS, we MUST handle the collision.
-- OR, we migrate to a true private tag system (add `user_id` to `tags` table).
-- Given the current schema `name VARCHAR(50) UNIQUE`, it's designed as a global dictionary.
-- Migrating to private tags would require:
-- 1. Drop UNIQUE constraint on `name`.
-- 2. Add `user_id` column.
-- 3. Update existing tags (who owns them? or duplicate them for each user who uses them?)

-- Let's try the RLS approach first, but we need to ensure the `get_or_create_tag` logic handles existence checks properly.
-- Typically, `INSERT ... ON CONFLICT DO NOTHING` returns the ID.
-- If we use RLS to hide others' tags, we can't look up the ID of a hidden tag.
-- So we CANNOT reuse the same tag ID if we can't see it.
-- This implies we MUST see it, or we MUST have separate tags.

-- DECISION: The current schema (Global Unique Tags) is incompatible with "Only see my tags" + "Create new tags" securely without leaking existence of other tags OR crashing on duplicates.
-- UNLESS: We assume "Tag Management" just means the LIST view, but "Autocomplete" can still search global?
-- The user said "只展示自己账号有的" (Only show what account has).

-- Let's look at `src/hooks/useTags.ts` or similar to see how tags are fetched.
-- If I just change the RLS for the `SELECT * FROM tags` query that populates the management list, that solves the visual issue.
-- But for "creation", we might need a Security Definer function to "Get or Create" tag ID without exposing the tag list to the user directly?

-- Let's try to implement the RLS change first. 
-- It is the most direct answer to "Only show tags I have".
-- Regarding the "Duplicate Error":
-- If User B tries to create "React" (hidden), and it fails, we can catch that error and say "Tag exists, linking..."
-- But we can't link it if we can't see the ID.

-- Actually, maybe we should just modify the Frontend Query?
-- "标签管理" implies a specific page or component.
-- If I change the RLS, it applies everywhere.

-- Let's check the code first.
