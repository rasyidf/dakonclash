export const TAILWIND_COLORS = {
  red: {
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
  },
  blue: {
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
  },
  green: {
    "100": "#dcfce7",
    "200": "#bbf7d0",
    "300": "#86efac",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
  },
  purple: {
    "100": "#f3e8ff",
    "200": "#e9d5ff",
    "300": "#d8b4fe",
    "400": "#c084fc",
    "500": "#a855f7",
    "600": "#9333ea",
  },
  orange: {
    "100": "#ffedd5",
    "300": "#fdba74",
    "400": "#fb923c",
    "500": "#f97316",
  },
  yellow: {
    "100": "#fef9c3",
    "200": "#fef08a",
    "300": "#fde047",
    "400": "#facc15",
    "500": "#eab308",
  },
  stone: {
    "200": "#e7e5e4",
    "300": "#d6d3d1",
    "400": "#a8a29e",
    "500": "#78716c",
    "600": "#57534e",
    "700": "#44403c",
    "800": "#292524",
  },
  gray: {
    "50": "#f9fafb",
    "100": "#f3f4f6",
    "200": "#e5e7eb",
    "300": "#d1d5db",
    "400": "#9ca3af",
    "500": "#6b7280",
    "600": "#4b5563",
    "700": "#374151",
    "800": "#1f2937",
    "900": "#111827",
  },
  white: "#ffffff",
  black: "#000000",
};

// Convert tailwind class to RGB color value
export const getTailwindColor = (classString?: string): string => {
  if (!classString) return "#ffffff";

  // Extract color information from tailwind class (e.g., "bg-red-500" -> "red-500")
  const bgMatch = classString.match(/bg-([a-z]+-[0-9]+|white|black)/);
  if (!bgMatch) return "#ffffff";

  const colorClass = bgMatch[1];

  if (colorClass === "white") return TAILWIND_COLORS.white;
  if (colorClass === "black") return TAILWIND_COLORS.black;

  const [colorName, shade] = colorClass.split("-");
  
  const color = TAILWIND_COLORS[colorName as keyof typeof TAILWIND_COLORS];
  const shadeColor = color ? color[shade as keyof typeof color] : undefined;
  
  return shadeColor || "#ffffff";
};