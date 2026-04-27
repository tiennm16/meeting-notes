import type { TextStyle } from "react-native";

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 22,
  "2xl": 28,
  display: 64,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
  h1: { fontSize: fontSize["2xl"], fontWeight: fontWeight.bold },
  h2: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  h3: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, lineHeight: 22 },
  bodySmall: { fontSize: fontSize.base, fontWeight: fontWeight.regular },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  button: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  buttonLarge: { fontSize: 24, fontWeight: fontWeight.bold },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
