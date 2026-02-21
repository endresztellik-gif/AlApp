-- ============================================================
-- Fix RLS issues and ensure essential tables are accessible
-- ============================================================

-- 1. Fix public.photos RLS (Reported Issue)
-- ============================================================
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow view photos for authenticated" ON public.photos;
CREATE POLICY "Allow view photos for authenticated" ON public.photos
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert photos for authenticated" ON public.photos;
CREATE POLICY "Allow insert photos for authenticated" ON public.photos
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Allow delete photos for admin or owner" ON public.photos;
CREATE POLICY "Allow delete photos for admin or owner" ON public.photos
    FOR DELETE TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
        OR
        uploaded_by = auth.uid()
    );

-- 2. Ensure user_profiles is accessible (Fix Application Hang)
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view profiles (needed for "Reported By", "Responsible", etc.)
DROP POLICY IF EXISTS "Allow view profiles for authenticated" ON public.user_profiles;
CREATE POLICY "Allow view profiles for authenticated" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (true);

-- Allow users to update their own profile (optional, but good practice)
DROP POLICY IF EXISTS "Allow update own profile" ON public.user_profiles;
CREATE POLICY "Allow update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 3. Ensure feature_flags is accessible
-- ============================================================
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow view feature_flags for authenticated" ON public.feature_flags;
CREATE POLICY "Allow view feature_flags for authenticated" ON public.feature_flags
    FOR SELECT TO authenticated
    USING (true);
