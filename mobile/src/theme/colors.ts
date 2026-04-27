export const palette = {
  slate950: "#0f172a",
  slate900: "#1e293b",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate100: "#f8fafc",
  slate50: "#f8fafc",
  gray400: "#9ca3af",
  blue600: "#2563eb",
  blue400: "#60a5fa",
  green500: "#22c55e",
  amber500: "#f59e0b",
  red500: "#ef4444",
  red600: "#dc2626",
  white: "#ffffff",
  black: "#000000",
} as const;

export const colors = {
  bg: {
    default: palette.slate950,
    surface: palette.slate900,
    input: palette.slate950,
  },
  border: {
    default: palette.slate900,
  },
  text: {
    primary: palette.slate100,
    secondary: palette.slate400,
    muted: palette.slate500,
    placeholder: palette.gray400,
    onAccent: palette.white,
    onBadge: palette.slate950,
    accent: palette.blue400,
    error: palette.red500,
  },
  accent: {
    primary: palette.blue600,
    secondary: palette.blue400,
  },
  status: {
    success: palette.green500,
    warning: palette.amber500,
    error: palette.red500,
    danger: palette.red600,
  },
} as const;

export type ColorTextKey = keyof typeof colors.text;
