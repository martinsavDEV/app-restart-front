
-- Drop existing permissive policies on lot_templates
DROP POLICY IF EXISTS "Authenticated users can create lot templates" ON public.lot_templates;
DROP POLICY IF EXISTS "Authenticated users can update lot templates" ON public.lot_templates;
DROP POLICY IF EXISTS "Authenticated users can view all lot templates" ON public.lot_templates;

-- Recreate with proper authentication checks
CREATE POLICY "Authenticated users can view all lot templates"
ON public.lot_templates FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create lot templates"
ON public.lot_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lot templates"
ON public.lot_templates FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
