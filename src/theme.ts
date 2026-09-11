// Design tokens converted from the Claude Design handoff (OKLCH -> sRGB hex).
// See design_handoff_nyumba_finder/README.md for the source values.

export const colors = {
  bgScreen: "#FAF6F3",
  cardSurface: "#FFFDFB",
  borderSubtle: "#DDD6D2",
  borderCard: "#E3DDD9",

  inkPrimary: "#211914",
  inkSecondary: "#6F6763",
  inkTertiary: "#9E9793",

  accent: "#0C5952",
  accentTint: "#D6F2EE",

  green: "#25984D",
  greenTint: "#D5F5DA",

  amber: "#CE871B",
  amberTint: "#FFE5C0",

  gray: "#958E8A",
  grayTint: "#ECE9E4",

  red: "#BD413F",
  redTint: "#FFDFDA"
};

export const radii = {
  card: 16,
  pill: 999,
  iconButton: 15
};

export const spacing = {
  screenX: 22,
  cardPadding: 14,
  sectionGap: 18
};

export const typography = {
  heading: { fontWeight: "800" as const, color: colors.inkPrimary },
  body: { fontWeight: "500" as const, color: colors.inkPrimary },
  meta: { fontWeight: "700" as const, color: colors.inkSecondary, fontSize: 11, letterSpacing: 0.4 }
};

export const availabilityColors = {
  available: { fg: colors.green, tint: colors.greenTint, label: "Available now" },
  available_soon: { fg: colors.amber, tint: colors.amberTint, label: "Available soon" },
  occupied: { fg: colors.gray, tint: colors.grayTint, label: "Occupied" }
} as const;
