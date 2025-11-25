-- Create price_items table for price database
CREATE TABLE public.price_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id text,
  item text NOT NULL,
  unit text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  date_modif timestamp with time zone,
  lot_code text NOT NULL DEFAULT 'fondation',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view all price items" 
ON public.price_items 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create price items" 
ON public.price_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update price items" 
ON public.price_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete price items" 
ON public.price_items 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_price_items_updated_at
BEFORE UPDATE ON public.price_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for lot_code for faster filtering
CREATE INDEX idx_price_items_lot_code ON public.price_items(lot_code);