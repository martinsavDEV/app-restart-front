-- Allow authenticated users to delete quote lines (not just admins)
DROP POLICY IF EXISTS "Only admins can delete quote lines" ON public.quote_lines;

CREATE POLICY "Authenticated users can delete quote lines"
ON public.quote_lines
FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users to delete lots (for consistency)
DROP POLICY IF EXISTS "Only admins can delete lots" ON public.lots;

CREATE POLICY "Authenticated users can delete lots"
ON public.lots
FOR DELETE
TO authenticated
USING (true);