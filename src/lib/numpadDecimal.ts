/**
 * Utilitaires pour gérer le point du pavé numérique comme virgule décimale
 * en locale française.
 */

/**
 * Parse une valeur numérique locale (accepte la virgule comme séparateur décimal).
 * Remplace les virgules par des points avant le parseFloat.
 */
export const parseLocaleNumber = (value: string): number => {
  const normalized = value.replace(",", ".");
  return parseFloat(normalized);
};

/**
 * Pattern de validation pour les champs numériques décimaux.
 * Accepte les nombres avec virgule ou point comme séparateur.
 */
export const NUMERIC_PATTERN = "[0-9]*[,.]?[0-9]*";
