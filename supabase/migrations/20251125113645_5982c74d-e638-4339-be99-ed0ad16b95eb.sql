-- Create lot_templates table
CREATE TABLE public.lot_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  template_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lot_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for lot_templates
CREATE POLICY "Authenticated users can view all lot templates" 
ON public.lot_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create lot templates" 
ON public.lot_templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lot templates" 
ON public.lot_templates 
FOR UPDATE 
USING (true);

CREATE POLICY "Only admins can delete lot templates" 
ON public.lot_templates 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lot_templates_updated_at
BEFORE UPDATE ON public.lot_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial templates
INSERT INTO public.lot_templates (code, label, description, template_lines) VALUES
('terrassement', 'Terrassement', 'Travaux de terrassement et préparation du terrain', '[
  {"designation": "Décapage terre végétale", "unit": "m3", "unit_price": 15, "comment": "Épaisseur 30cm"},
  {"designation": "Terrassement en déblai", "unit": "m3", "unit_price": 25, "comment": "Catégorie 2"},
  {"designation": "Remblai compacté", "unit": "m3", "unit_price": 30, "comment": "Compactage 95% OPN"}
]'::jsonb),
('renforcement_sol', 'Renforcement de sol', 'Renforcement et stabilisation des sols', '[
  {"designation": "Colonnes ballastées", "unit": "ml", "unit_price": 120, "comment": "Diamètre 80cm"},
  {"designation": "Géotextile", "unit": "m2", "unit_price": 8, "comment": "200g/m2"},
  {"designation": "Couche de forme", "unit": "m3", "unit_price": 45, "comment": "GNT 0/31.5"}
]'::jsonb),
('fondations', 'Fondations', 'Fondations et massifs béton', '[
  {"designation": "Béton de propreté", "unit": "m3", "unit_price": 150, "comment": "Épaisseur 10cm"},
  {"designation": "Béton armé C30/37", "unit": "m3", "unit_price": 280, "comment": "Fondation massif"},
  {"designation": "Acier HA", "unit": "t", "unit_price": 1800, "comment": "FeE500"},
  {"designation": "Coffrage", "unit": "m2", "unit_price": 45, "comment": "Coffrage périphérique"}
]'::jsonb),
('electricite', 'Électricité', 'Installations électriques', '[
  {"designation": "Câble HTA", "unit": "ml", "unit_price": 85, "comment": "3x240mm2 20kV"},
  {"designation": "Tranchée câble", "unit": "ml", "unit_price": 60, "comment": "Profondeur 1.2m"},
  {"designation": "Transformateur", "unit": "u", "unit_price": 45000, "comment": "2500kVA"},
  {"designation": "Cellule HTA", "unit": "u", "unit_price": 12000, "comment": "Arrivée/départ"}
]'::jsonb),
('turbinier', 'Turbinier', 'Fourniture et installation des éoliennes', '[
  {"designation": "Éolienne complète", "unit": "u", "unit_price": 1200000, "comment": "3MW incluant transport"},
  {"designation": "Levage et montage", "unit": "u", "unit_price": 150000, "comment": "Grue 750t"},
  {"designation": "Mise en service", "unit": "u", "unit_price": 25000, "comment": "Formation incluse"}
]'::jsonb);