import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { colors } from "@/src/theme";
import { TIMING } from "@/src/constant";

const DEFAULT_THROTTLE_MS = TIMING.buttonThrottleMs;

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface CustomizedButtonProps extends TouchableOpacityProps {
  /**
   * Visual style. Omit to behave as a raw TouchableOpacity (useful for
   * row-taps and bespoke shapes — pass your own `style`).
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Replace children with a centered spinner and disable the press handler. */
  loading?: boolean;
  fullWidth?: boolean;
  /**
   * Disable the built-in tap throttle and let every press fire `onPress`.
   * Use this for buttons where rapid repeated taps are intentional
   * (e.g. quantity steppers).
   */
  allowSpam?: boolean;
  /**
   * Throttle window in milliseconds. The first tap fires immediately;
   * subsequent taps within the window are dropped. Ignored when
   * `allowSpam` is true. Defaults to 500.
   */
  throttleMs?: number;
}

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
  md: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
  lg: { paddingVertical: 14, paddingHorizontal: 20, minHeight: 52 },
};

const VARIANT_STYLES: Record<
  ButtonVariant,
  { container: ViewStyle; spinner: string }
> = {
  primary: {
    container: {
      backgroundColor: colors.accent.primary,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: colors.text.onAccent,
  },
  secondary: {
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: colors.text.primary,
  },
  ghost: {
    container: {
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: colors.text.muted,
  },
  danger: {
    container: {
      backgroundColor: colors.status.danger,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: colors.text.onAccent,
  },
};

export function CustomizedButton({
  variant,
  size = "md",
  loading = false,
  fullWidth = false,
  allowSpam = false,
  throttleMs = DEFAULT_THROTTLE_MS,
  disabled,
  style,
  onPress,
  children,
  ...rest
}: CustomizedButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variant ? VARIANT_STYLES[variant] : undefined;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (!onPress) return;
      if (allowSpam) {
        onPress(e);
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onPress(e);
      }, throttleMs);
    },
    [onPress, allowSpam, throttleMs],
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      {...rest}
      disabled={isDisabled}
      onPress={handlePress}
      style={[
        variantStyle?.container,
        variant ? SIZE_STYLES[size] : null,
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle?.spinner ?? colors.text.primary}
        />
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.6 },
});
