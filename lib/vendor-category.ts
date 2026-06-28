export const VENDOR_CATEGORIES = [
  "Catering",
  "Photo & Video",
  "Decor & Florals",
  "Music",
  "Makeup",
  "Tenting",
  "Priest",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Catering: "oklch(0.55 0.13 28)",
  "Photo & Video": "oklch(0.52 0.12 250)",
  "Decor & Florals": "oklch(0.55 0.13 150)",
  Music: "oklch(0.52 0.12 300)",
  Makeup: "oklch(0.58 0.12 350)",
  Tenting: "oklch(0.50 0.10 80)",
  Priest: "oklch(0.50 0.12 200)",
};

export function colorForCategory(category: string): string {
  return CATEGORY_COLORS[category] ?? "oklch(0.55 0.02 60)";
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
