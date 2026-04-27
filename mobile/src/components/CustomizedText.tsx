import { Text, TextProps } from "react-native";
import { colors, typography } from "@/src/theme";
import type { ColorTextKey, TypographyVariant } from "@/src/theme";

export interface CustomizedTextProps extends TextProps {
  /** Typography variant from the design system. Defaults to `body`. */
  variant?: TypographyVariant;
  /**
   * Color: either a key from `colors.text` (e.g. `'primary'`, `'secondary'`)
   * or a raw color string. Defaults to `'primary'`.
   */
  color?: ColorTextKey | (string & {});
}

const TEXT_COLORS = colors.text as Record<string, string>;

export function CustomizedText({
  variant = "body",
  color = "primary",
  style,
  ...rest
}: CustomizedTextProps) {
  const variantStyle = typography[variant];
  const resolvedColor = TEXT_COLORS[color] ?? color;
  return (
    <Text {...rest} style={[variantStyle, { color: resolvedColor }, style]} />
  );
}
