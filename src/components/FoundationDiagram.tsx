import { useMemo } from "react";
import { formatNumber } from "@/lib/foundationCalculations";
import { Badge } from "@/components/ui/badge";

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
    const svgWidth = 600;
    const svgHeight = 280;
    const padding = { top: 45, bottom: 30, left: 40, right: 60 };

    // Calculate scale
    const maxWidth = rayonHaut * 2;
    const scaleX = (svgWidth - padding.left - padding.right) / maxWidth;
    const scaleY = (svgHeight - padding.top - padding.bottom) / (hauteurCage * 1.2);
    const scale = Math.min(scaleX, scaleY);

    // Ground level Y (TN 0.00)
    const groundY = padding.top + 20;
    const bottomY = groundY + hauteurCage * scale;

    // Center X
    const centerX = svgWidth / 2;

    // Scaled radii
    const scaledRayonBas = rayonBas * scale;
    const scaledRayonHaut = rayonHaut * scale;
    const scaledDiametre = (diametre / 2) * scale;
    const scaledMarge = marge * scale;
    const scaledHauteur = hauteurCage * scale;

    // Foundation cage dimensions (typical anchor cage shape)
    const cageWidth = scaledDiametre * 0.8;
    const cageHeight = scaledHauteur * 0.7;
    const cageTopY = bottomY - cageHeight;
    const cageBottomWidth = cageWidth * 0.6;

    return {
      svgWidth,
      svgHeight,
      centerX,
      groundY,
      bottomY,
      scaledRayonBas,
      scaledRayonHaut,
      scaledDiametre,
      scaledMarge,
      scaledHauteur,
      cageWidth,
      cageHeight,
      cageTopY,
      cageBottomWidth,
      scale,
    };
  }, [diametre, marge, rayonBas, rayonHaut, hauteurCage]);

  const {
    svgWidth,
    svgHeight,
    centerX,
    groundY,
    bottomY,
    scaledRayonBas,
    scaledRayonHaut,
    scaledDiametre,
    scaledMarge,
    scaledHauteur,
    cageWidth,
    cageHeight,
    cageTopY,
    cageBottomWidth,
  } = dimensions;

  // Diameter at top of excavation
  const topDiameter = rayonHaut * 2;

  return (
    <div className="bg-gradient-to-b from-sky-50/50 to-amber-50/30 dark:from-sky-900/10 dark:to-amber-900/10 rounded-lg border overflow-hidden">
      {/* Badge label */}
      <div className="absolute m-2">
        <Badge variant="secondary" className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
          COUPE TRANSVERSALE
        </Badge>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: "240px" }}
        aria-label="Vue en coupe de la fondation"
      >
        <defs>
          {/* Soil/earth gradient */}
          <linearGradient id="soilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="50%" stopColor="#c19a6b" />
            <stop offset="100%" stopColor="#a67c52" />
          </linearGradient>

          {/* Talus fill gradient */}
          <linearGradient id="talusGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f4d03f" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4a574" stopOpacity="0.8" />
          </linearGradient>

          {/* Foundation concrete gradient */}
          <linearGradient id="concreteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Sky gradient */}
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>

        {/* Sky background above ground */}
        <rect
          x="0"
          y="0"
          width={svgWidth}
          height={groundY}
          fill="url(#skyGradient)"
          className="dark:opacity-20"
        />

        {/* Ground/soil below excavation (sides) */}
        <rect
          x="0"
          y={groundY}
          width={svgWidth}
          height={svgHeight - groundY}
          fill="url(#soilGradient)"
          className="dark:opacity-40"
        />

        {/* Excavation hole (trapezoid cut into ground) - white/empty space */}
        <polygon
          points={`
            ${centerX - scaledRayonHaut},${groundY}
            ${centerX + scaledRayonHaut},${groundY}
            ${centerX + scaledRayonBas},${bottomY}
            ${centerX - scaledRayonBas},${bottomY}
          `}
          fill="#fef3c7"
          className="dark:fill-amber-100/20"
        />

        {/* Talus outline (embankment slopes) */}
        {/* Left talus */}
        <polygon
          points={`
            ${centerX - scaledRayonHaut},${groundY}
            ${centerX - scaledRayonBas},${bottomY}
            ${centerX - scaledRayonHaut - 10},${groundY}
          `}
          fill="url(#talusGradient)"
          stroke="#c2410c"
          strokeWidth="2"
          className="dark:fill-amber-600/30 dark:stroke-amber-500"
        />

        {/* Right talus */}
        <polygon
          points={`
            ${centerX + scaledRayonHaut},${groundY}
            ${centerX + scaledRayonBas},${bottomY}
            ${centerX + scaledRayonHaut + 10},${groundY}
          `}
          fill="url(#talusGradient)"
          stroke="#c2410c"
          strokeWidth="2"
          className="dark:fill-amber-600/30 dark:stroke-amber-500"
        />

        {/* Foundation concrete base (bottom plate) */}
        <rect
          x={centerX - scaledDiametre}
          y={bottomY - 8}
          width={scaledDiametre * 2}
          height={8}
          fill="url(#concreteGradient)"
          stroke="#334155"
          strokeWidth="1"
          className="dark:fill-slate-600 dark:stroke-slate-400"
        />

        {/* Anchor cage shape (characteristic trapezoid shape) */}
        <polygon
          points={`
            ${centerX - cageWidth / 2},${cageTopY}
            ${centerX + cageWidth / 2},${cageTopY}
            ${centerX + cageBottomWidth / 2},${bottomY - 8}
            ${centerX - cageBottomWidth / 2},${bottomY - 8}
          `}
          fill="url(#concreteGradient)"
          stroke="#334155"
          strokeWidth="1.5"
          className="dark:fill-slate-600 dark:stroke-slate-400"
        />

        {/* Cage top ring (circular element representation) */}
        <ellipse
          cx={centerX}
          cy={cageTopY + 4}
          rx={cageWidth / 2 - 5}
          ry={8}
          fill="none"
          stroke="#334155"
          strokeWidth="2"
          className="dark:stroke-slate-400"
        />

        {/* Ground level line (TN 0.00) - dashed green line */}
        <line
          x1="0"
          y1={groundY}
          x2={svgWidth}
          y2={groundY}
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="8,4"
          className="dark:stroke-green-400"
        />

        {/* TN 0.00 label */}
        <text
          x={svgWidth - 45}
          y={groundY - 5}
          className="fill-green-600 dark:fill-green-400 text-[11px] font-bold"
          textAnchor="end"
        >
          TN 0.00
        </text>

        {/* Dimension: Top diameter */}
        <g>
          <line
            x1={centerX - scaledRayonHaut}
            y1={groundY + 12}
            x2={centerX + scaledRayonHaut}
            y2={groundY + 12}
            stroke="#1e3a5f"
            strokeWidth="1"
            className="dark:stroke-slate-300"
          />
          <line
            x1={centerX - scaledRayonHaut}
            y1={groundY + 6}
            x2={centerX - scaledRayonHaut}
            y2={groundY + 18}
            stroke="#1e3a5f"
            strokeWidth="1"
            className="dark:stroke-slate-300"
          />
          <line
            x1={centerX + scaledRayonHaut}
            y1={groundY + 6}
            x2={centerX + scaledRayonHaut}
            y2={groundY + 18}
            stroke="#1e3a5f"
            strokeWidth="1"
            className="dark:stroke-slate-300"
          />
          <text
            x={centerX}
            y={groundY + 25}
            textAnchor="middle"
            className="fill-slate-700 dark:fill-slate-200 text-[11px] font-mono font-bold"
          >
            Ø {formatNumber(topDiameter, 2)} m
          </text>
        </g>

        {/* Dimension: Height (right side) */}
        <g>
          <line
            x1={centerX + scaledRayonBas + 20}
            y1={groundY}
            x2={centerX + scaledRayonBas + 20}
            y2={bottomY}
            stroke="#1e3a5f"
            strokeWidth="1"
            className="dark:stroke-slate-300"
          />
          <line
            x1={centerX + scaledRayonBas + 14}
            y1={groundY}
            x2={centerX + scaledRayonBas + 26}
            y2={groundY}
            stroke="#1e3a5f"
            strokeWidth="1"
            className="dark:stroke-slate-300"
          />
          <line
            x1={centerX + scaledRayonBas + 14}
            y1={bottomY}
            x2={centerX + scaledRayonBas + 26}
            y2={bottomY}
            stroke="#1e3a5f"
            strokeWidth="1"
            className="dark:stroke-slate-300"
          />
          <text
            x={centerX + scaledRayonBas + 40}
            y={(groundY + bottomY) / 2 + 4}
            textAnchor="middle"
            className="fill-slate-700 dark:fill-slate-200 text-[11px] font-mono font-bold"
          >
            {formatNumber(hauteurCage, 2)} m
          </text>
        </g>

        {/* Slope label on left talus */}
        <text
          x={centerX - scaledRayonHaut - 25}
          y={(groundY + bottomY) / 2}
          textAnchor="middle"
          className="fill-orange-700 dark:fill-orange-400 text-[10px] font-semibold"
          transform={`rotate(-50, ${centerX - scaledRayonHaut - 25}, ${(groundY + bottomY) / 2})`}
        >
          {penteTalus}
        </text>

        {/* Foundation diameter at bottom (in excavation) */}
        <g>
          <line
            x1={centerX - scaledDiametre}
            y1={bottomY + 12}
            x2={centerX + scaledDiametre}
            y2={bottomY + 12}
            stroke="#6366f1"
            strokeWidth="1.5"
            className="dark:stroke-indigo-400"
          />
          <text
            x={centerX}
            y={bottomY + 24}
            textAnchor="middle"
            className="fill-indigo-600 dark:fill-indigo-400 text-[10px] font-mono"
          >
            Ø fondation {diametre} m
          </text>
        </g>

        {/* Margin indicators on bottom */}
        <g className="opacity-70">
          <line
            x1={centerX - scaledDiametre}
            y1={bottomY - 4}
            x2={centerX - scaledRayonBas}
            y2={bottomY - 4}
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            className="dark:stroke-emerald-400"
          />
          <line
            x1={centerX + scaledDiametre}
            y1={bottomY - 4}
            x2={centerX + scaledRayonBas}
            y2={bottomY - 4}
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            className="dark:stroke-emerald-400"
          />
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-3 pb-2 text-[10px] flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gradient-to-b from-slate-400 to-slate-600 rounded-sm border border-slate-500" />
          <span className="text-muted-foreground">Fondation béton</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gradient-to-b from-yellow-300/60 to-amber-400/80 rounded-sm border border-orange-600" />
          <span className="text-muted-foreground">Talus {penteTalus}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500 rounded" />
          <span className="text-muted-foreground">Marge {marge}m</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-green-500 border-dashed" style={{ borderBottom: "2px dashed" }} />
          <span className="text-muted-foreground">TN 0.00</span>
        </div>
      </div>
    </div>
  );
};
