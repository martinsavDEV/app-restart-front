import { useMemo } from "react";
import { formatNumber } from "@/lib/foundationCalculations";

interface FoundationDiagramProps {
  diametre: number;
  marge: number;
  hauteurCage: number;
  penteTalus: string;
  rayonBas: number;
  rayonHaut: number;
}

export const FoundationDiagram = ({
  diametre,
  marge,
  hauteurCage,
  penteTalus,
  rayonBas,
  rayonHaut,
}: FoundationDiagramProps) => {
  const dimensions = useMemo(() => {
    // SVG dimensions
    const svgWidth = 400;
    const svgHeight = 200;
    const padding = 40;
    
    // Scale factors
    const maxRadius = rayonHaut;
    const scaleX = (svgWidth - 2 * padding) / (2 * maxRadius);
    const scaleY = (svgHeight - 2 * padding) / hauteurCage;
    const scale = Math.min(scaleX, scaleY);
    
    // Center point
    const centerX = svgWidth / 2;
    const bottomY = svgHeight - padding;
    const topY = bottomY - hauteurCage * scale;
    
    // Scaled radii
    const scaledRayonBas = rayonBas * scale;
    const scaledRayonHaut = rayonHaut * scale;
    const scaledDiametre = (diametre / 2) * scale;
    
    return {
      svgWidth,
      svgHeight,
      centerX,
      bottomY,
      topY,
      scaledRayonBas,
      scaledRayonHaut,
      scaledDiametre,
      scale,
    };
  }, [diametre, rayonBas, rayonHaut, hauteurCage]);

  const {
    svgWidth,
    svgHeight,
    centerX,
    bottomY,
    topY,
    scaledRayonBas,
    scaledRayonHaut,
    scaledDiametre,
  } = dimensions;

  return (
    <div className="bg-muted/20 rounded-lg p-4 border">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto max-h-48"
        aria-label="Vue en coupe de la fondation"
      >
        {/* Background grid pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted-foreground/10"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Excavation trapezoid (cross-section) */}
        <polygon
          points={`
            ${centerX - scaledRayonHaut},${topY}
            ${centerX + scaledRayonHaut},${topY}
            ${centerX + scaledRayonBas},${bottomY}
            ${centerX - scaledRayonBas},${bottomY}
          `}
          className="fill-amber-100/50 dark:fill-amber-900/30 stroke-amber-600 dark:stroke-amber-400"
          strokeWidth="2"
        />

        {/* Foundation circle representation (at bottom) */}
        <line
          x1={centerX - scaledDiametre}
          y1={bottomY}
          x2={centerX + scaledDiametre}
          y2={bottomY}
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Margin indicators */}
        <line
          x1={centerX - scaledDiametre}
          y1={bottomY}
          x2={centerX - scaledRayonBas}
          y2={bottomY}
          className="stroke-emerald-500"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1={centerX + scaledDiametre}
          y1={bottomY}
          x2={centerX + scaledRayonBas}
          y2={bottomY}
          className="stroke-emerald-500"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Dimension lines and labels */}
        {/* Top radius dimension */}
        <g className="text-muted-foreground">
          <line
            x1={centerX - scaledRayonHaut}
            y1={topY - 15}
            x2={centerX + scaledRayonHaut}
            y2={topY - 15}
            stroke="currentColor"
            strokeWidth="1"
            markerStart="url(#arrowLeft)"
            markerEnd="url(#arrowRight)"
          />
          <text
            x={centerX}
            y={topY - 20}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-mono"
          >
            ⌀ {formatNumber(rayonHaut * 2, 2)} m
          </text>
        </g>

        {/* Bottom radius dimension */}
        <g className="text-muted-foreground">
          <line
            x1={centerX - scaledRayonBas}
            y1={bottomY + 15}
            x2={centerX + scaledRayonBas}
            y2={bottomY + 15}
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x={centerX}
            y={bottomY + 28}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-mono"
          >
            R = {formatNumber(rayonBas, 2)} m (Ø{diametre} + 2×{marge}m)
          </text>
        </g>

        {/* Height dimension */}
        <g className="text-muted-foreground">
          <line
            x1={centerX + scaledRayonHaut + 20}
            y1={topY}
            x2={centerX + scaledRayonHaut + 20}
            y2={bottomY}
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x={centerX + scaledRayonHaut + 35}
            y={(topY + bottomY) / 2}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-mono"
            transform={`rotate(90, ${centerX + scaledRayonHaut + 35}, ${(topY + bottomY) / 2})`}
          >
            H = {formatNumber(hauteurCage, 2)} m
          </text>
        </g>

        {/* Slope annotation */}
        <text
          x={centerX - scaledRayonBas - 15}
          y={(topY + bottomY) / 2}
          textAnchor="middle"
          className="fill-amber-600 dark:fill-amber-400 text-[9px] font-semibold"
          transform={`rotate(-45, ${centerX - scaledRayonBas - 15}, ${(topY + bottomY) / 2})`}
        >
          Talus {penteTalus}
        </text>

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowLeft"
            markerWidth="6"
            markerHeight="6"
            refX="0"
            refY="3"
            orient="auto"
          >
            <path d="M6,0 L0,3 L6,6 Z" className="fill-muted-foreground" />
          </marker>
          <marker
            id="arrowRight"
            markerWidth="6"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" className="fill-muted-foreground" />
          </marker>
        </defs>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-primary rounded" />
          <span className="text-muted-foreground">Fondation (Ø{diametre}m)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-emerald-500 rounded" />
          <span className="text-muted-foreground">Marge ({marge}m)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-100/50 dark:bg-amber-900/30 border border-amber-600 dark:border-amber-400 rounded-sm" />
          <span className="text-muted-foreground">Talus</span>
        </div>
      </div>
    </div>
  );
};
