-- Add role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings
-- Allow everyone (authenticated or not, depending on requirement, but usually authenticated) to read default key
-- Since we might need it for public features? No, AI features are likely for logged in users.
CREATE POLICY "Allow authenticated read system settings" ON public.system_settings
    FOR SELECT TO authenticated USING (true);

-- Allow admin to update system settings
CREATE POLICY "Allow admin update system settings" ON public.system_settings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admin to insert system settings
CREATE POLICY "Allow admin insert system settings" ON public.system_settings
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default row for deepseek key if not exists
INSERT INTO public.system_settings (key, value)
VALUES ('deepseek_default_key', '')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO authenticated;

-- Function to make a user admin (helper)
-- Usage: SELECT make_admin('user_email@example.com');
CREATE OR REPLACE FUNCTION public.make_admin(user_email text)
RETURNS void AS $$
BEGIN
    UPDATE public.users SET role = 'admin' WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
