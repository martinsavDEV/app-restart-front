/**
 * Foundation calculation utilities
 * Calculates excavation surface and earthworks volume for wind turbine foundations
 */

/**
 * Parse slope ratio string to numeric value
 * @param pente - Slope ratio string (e.g., "1:1", "3:2", or custom "x:y")
 * @returns Numeric slope coefficient
 */
export const parsePenteRatio = (pente: string): number => {
  if (pente === "1:1") return 1;
  if (pente === "3:2") return 1.5;
  
  const parts = pente.split(":");
  if (parts.length === 2) {
    const horizontal = parseFloat(parts[0]);
    const vertical = parseFloat(parts[1]);
    if (!isNaN(horizontal) && !isNaN(vertical) && vertical !== 0) {
      return horizontal / vertical;
    }
  }
  return 1; // Default to 1:1
};

/**
 * Calculate bottom radius of excavation
 * R = (diameter + 2 × margin) / 2
 */
export const calculateBottomRadius = (diametre: number, marge: number): number => {
  return (diametre + 2 * marge) / 2;
};

/**
 * Calculate excavation base surface area
 * S = π × R²
 */
export const calculateSurfaceFondFouille = (rayonBas: number): number => {
  return Math.PI * rayonBas * rayonBas;
};

/**
 * Calculate top radius of excavation
 * r = R + (height × slope)
 */
export const calculateTopRadius = (rayonBas: number, hauteur: number, pente: number): number => {
  return rayonBas + (hauteur * pente);
};

/**
 * Calculate truncated cone volume (earthworks)
 * V = π × (H/3) × (R² + r² + R×r)
 */
export const calculateVolumeTerrassement = (
  rayonBas: number,
  rayonHaut: number,
  hauteur: number
): number => {
  return (Math.PI * hauteur / 3) * (
    rayonBas * rayonBas + 
    rayonHaut * rayonHaut + 
    rayonBas * rayonHaut
  );
};

/**
 * Calculate all foundation metrics
 */
export interface FoundationMetrics {
  rayonBas: number;           // R - Bottom radius (m)
  rayonHaut: number;          // r - Top radius (m)
  surfaceFondFouille: number; // Base surface area (m²)
  volumeTerrassement: number; // Earthworks volume (m³)
  penteCoeff: number;         // Slope coefficient
}

export const calculateFoundationMetrics = (
  diametre: number | null,
  marge: number,
  penteTalus: string,
  hauteurCage: number
): FoundationMetrics | null => {
  if (diametre === null || diametre <= 0) return null;
  
  const penteCoeff = parsePenteRatio(penteTalus);
  const rayonBas = calculateBottomRadius(diametre, marge);
  const surfaceFondFouille = calculateSurfaceFondFouille(rayonBas);
  const rayonHaut = calculateTopRadius(rayonBas, hauteurCage, penteCoeff);
  const volumeTerrassement = calculateVolumeTerrassement(rayonBas, rayonHaut, hauteurCage);
  
  return {
    rayonBas,
    rayonHaut,
    surfaceFondFouille,
    volumeTerrassement,
    penteCoeff,
  };
};

/**
 * Calculate substitution volume for a single turbine
 * V_sub = surface_fond_fouille × substitution_height
 */
export const calculateSubstitutionVolume = (
  surfaceFondFouille: number,
  substitutionHeight: number
): number => {
  return surfaceFondFouille * substitutionHeight;
};

/**
 * Format number for display with locale
 */
export const formatNumber = (value: number, decimals: number = 1): string => {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
