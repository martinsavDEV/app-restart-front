-- Create quote_sections table to manage sections with multipliers
CREATE TABLE IF NOT EXISTS public.quote_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_multiple BOOLEAN NOT NULL DEFAULT false,
  multiplier INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add section_id to quote_lines
ALTER TABLE public.quote_lines
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.quote_sections(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quote_sections_lot_id ON public.quote_sections(lot_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_section_id ON public.quote_lines(section_id);

-- Enable RLS
ALTER TABLE public.quote_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quote_sections
CREATE POLICY "Authenticated users can view all quote sections"
ON public.quote_sections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create quote sections"
ON public.quote_sections FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update quote sections"
ON public.quote_sections FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete quote sections"
ON public.quote_sections FOR DELETE
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_quote_sections_updated_at
BEFORE UPDATE ON public.quote_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();