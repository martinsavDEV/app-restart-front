-- Update lot_templates structure to support sections
-- First, backup existing templates by creating new format
UPDATE public.lot_templates
SET template_lines = jsonb_build_object(
  'sections', jsonb_build_array(
    jsonb_build_object(
      'title', 'Section principale',
      'lines', template_lines
    )
  )
)
WHERE jsonb_typeof(template_lines) = 'array';

-- Update fondations template with detailed structure
UPDATE public.lot_templates
SET 
  template_lines = '{
    "sections": [
      {
        "title": "Travaux préparatoires",
        "lines": [
          {"designation": "Installation", "quantity": 1, "unit": "ft", "unit_price": 35000, "comment": ""},
          {"designation": "remise en état", "quantity": 0, "unit": "ft", "unit_price": 0, "comment": ""},
          {"designation": "sécu", "quantity": 0, "unit": "ft", "unit_price": 0, "comment": ""},
          {"designation": "convenance", "quantity": 0, "unit": "ft", "unit_price": 0, "comment": ""},
          {"designation": "management suivi", "quantity": 0, "unit": "ft", "unit_price": 0, "comment": ""}
        ]
      },
      {
        "title": "fondation",
        "lines": [
          {"designation": "Béton de propreté", "quantity": 1, "unit": "ft", "unit_price": 10000, "comment": ""},
          {"designation": "cage d''ancrage", "quantity": 1, "unit": "ft", "unit_price": 5000, "comment": ""},
          {"designation": "ferraillage", "quantity": 65550, "unit": "kg", "unit_price": 1.15, "comment": ""},
          {"designation": "béton socle", "quantity": 550, "unit": "m3", "unit_price": 190, "comment": ""},
          {"designation": "béton assiette", "quantity": 25, "unit": "m3", "unit_price": 195, "comment": ""},
          {"designation": "coffrage", "quantity": 1, "unit": "ft", "unit_price": 1500, "comment": ""},
          {"designation": "MALT", "quantity": 1, "unit": "ft", "unit_price": 5000, "comment": ""},
          {"designation": "Fourreaux", "quantity": 1, "unit": "ft", "unit_price": 1000, "comment": ""},
          {"designation": "grouting", "quantity": 1, "unit": "ft", "unit_price": 0, "comment": ""},
          {"designation": "sealing", "quantity": 1, "unit": "ft", "unit_price": 0, "comment": ""}
        ]
      },
      {
        "title": "Assurance et plans",
        "lines": [
          {"designation": "assurance", "quantity": 1, "unit": "ft", "unit_price": 25000, "comment": ""},
          {"designation": "plans", "quantity": 1, "unit": "ft", "unit_price": 2000, "comment": ""}
        ]
      }
    ]
  }'::jsonb,
  description = 'Template détaillé : Travaux préparatoires, fondation, assurance et plans'
WHERE code = 'fondations';

-- Update other templates with section structure
UPDATE public.lot_templates
SET 
  template_lines = '{
    "sections": [
      {
        "title": "Travaux de terrassement",
        "lines": [
          {"designation": "Décapage terre végétale", "quantity": 0, "unit": "m3", "unit_price": 15, "comment": "Épaisseur 30cm"},
          {"designation": "Terrassement en déblai", "quantity": 0, "unit": "m3", "unit_price": 25, "comment": "Catégorie 2"},
          {"designation": "Remblai compacté", "quantity": 0, "unit": "m3", "unit_price": 30, "comment": "Compactage 95% OPN"}
        ]
      }
    ]
  }'::jsonb
WHERE code = 'terrassement';

UPDATE public.lot_templates
SET 
  template_lines = '{
    "sections": [
      {
        "title": "Renforcement et stabilisation",
        "lines": [
          {"designation": "Colonnes ballastées", "quantity": 0, "unit": "ml", "unit_price": 120, "comment": "Diamètre 80cm"},
          {"designation": "Géotextile", "quantity": 0, "unit": "m2", "unit_price": 8, "comment": "200g/m2"},
          {"designation": "Couche de forme", "quantity": 0, "unit": "m3", "unit_price": 45, "comment": "GNT 0/31.5"}
        ]
      }
    ]
  }'::jsonb
WHERE code = 'renforcement_sol';

UPDATE public.lot_templates
SET 
  template_lines = '{
    "sections": [
      {
        "title": "Réseaux électriques",
        "lines": [
          {"designation": "Câble HTA", "quantity": 0, "unit": "ml", "unit_price": 85, "comment": "3x240mm2 20kV"},
          {"designation": "Tranchée câble", "quantity": 0, "unit": "ml", "unit_price": 60, "comment": "Profondeur 1.2m"},
          {"designation": "Transformateur", "quantity": 0, "unit": "u", "unit_price": 45000, "comment": "2500kVA"},
          {"designation": "Cellule HTA", "quantity": 0, "unit": "u", "unit_price": 12000, "comment": "Arrivée/départ"}
        ]
      }
    ]
  }'::jsonb
WHERE code = 'electricite';

UPDATE public.lot_templates
SET 
  template_lines = '{
    "sections": [
      {
        "title": "Fourniture et installation",
        "lines": [
          {"designation": "Éolienne complète", "quantity": 0, "unit": "u", "unit_price": 1200000, "comment": "3MW incluant transport"},
          {"designation": "Levage et montage", "quantity": 0, "unit": "u", "unit_price": 150000, "comment": "Grue 750t"},
          {"designation": "Mise en service", "quantity": 0, "unit": "u", "unit_price": 25000, "comment": "Formation incluse"}
        ]
      }
    ]
  }'::jsonb
WHERE code = 'turbinier';