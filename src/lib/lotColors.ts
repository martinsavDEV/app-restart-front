export const LOT_COLORS: Record<string, { 
  bg: string; 
  bgActive: string; 
  border: string; 
  text: string;
  textActive: string;
}> = {
  terrassement: {
    bg: "bg-orange-100",
    bgActive: "bg-orange-500",
    border: "border-orange-400",
    text: "text-orange-700",
    textActive: "text-white",
  },
  renforcement_sol: {
    bg: "bg-pink-100",
    bgActive: "bg-pink-500",
    border: "border-pink-400",
    text: "text-pink-700",
    textActive: "text-white",
  },
  renforcement: {
    bg: "bg-pink-100",
    bgActive: "bg-pink-500",
    border: "border-pink-400",
    text: "text-pink-700",
    textActive: "text-white",
  },
  fondations: {
    bg: "bg-yellow-100",
    bgActive: "bg-yellow-500",
    border: "border-yellow-400",
    text: "text-yellow-700",
    textActive: "text-white",
  },
  fondation: {
    bg: "bg-yellow-100",
    bgActive: "bg-yellow-500",
    border: "border-yellow-400",
    text: "text-yellow-700",
    textActive: "text-white",
  },
  electricite: {
    bg: "bg-sky-100",
    bgActive: "bg-sky-500",
    border: "border-sky-400",
    text: "text-sky-700",
    textActive: "text-white",
  },
  turbinier: {
    bg: "bg-blue-100",
    bgActive: "bg-blue-600",
    border: "border-blue-500",
    text: "text-blue-700",
    textActive: "text-white",
  },
  turbine: {
    bg: "bg-blue-100",
    bgActive: "bg-blue-600",
    border: "border-blue-500",
    text: "text-blue-700",
    textActive: "text-white",
  },
};

// RGB colors for PDF export
export const LOT_COLORS_RGB: Record<string, [number, number, number]> = {
  terrassement: [249, 115, 22],     // Orange-500
  renforcement_sol: [236, 72, 153], // Pink-500
  renforcement: [236, 72, 153],     // Pink-500
  fondations: [234, 179, 8],        // Yellow-500
  fondation: [234, 179, 8],         // Yellow-500
  electricite: [14, 165, 233],      // Sky-500
  turbinier: [37, 99, 235],         // Blue-600
  turbine: [37, 99, 235],           // Blue-600
};

export const getLotColors = (code: string) => {
  const normalizedCode = code?.toLowerCase() || '';
  return LOT_COLORS[normalizedCode] || {
    bg: "bg-gray-100",
    bgActive: "bg-gray-500",
    border: "border-gray-400",
    text: "text-gray-700",
    textActive: "text-white",
  };
};

export const getLotColorRGB = (code: string): [number, number, number] => {
  const normalizedCode = code?.toLowerCase() || '';
  return LOT_COLORS_RGB[normalizedCode] || [107, 114, 128]; // Gray-500 default
};
