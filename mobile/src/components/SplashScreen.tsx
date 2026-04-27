import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CustomizedText } from "./CustomizedText";
import { STRINGS } from "@/src/constant";
import { colors } from "@/src/theme";

/**
 * In-app splash shown while we hydrate auth from secure storage and decide
 * whether to send the user to /login or the (tabs) group. The native splash
 * (configured in app.config.ts) covers the moment from app launch until React
 * mounts; this component takes over after that.
 */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <CustomizedText style={styles.logo}>{STRINGS.splash.logo}</CustomizedText>
        <CustomizedText variant="h1" style={styles.title}>
          {STRINGS.splash.title}
        </CustomizedText>
      </View>

      <View style={styles.spinnerWrap}>
        <ActivityIndicator color={colors.accent.secondary} size="large" />
        <CustomizedText
          variant="caption"
          color="secondary"
          style={styles.subtitle}
        >
          {STRINGS.splash.subtitle}
        </CustomizedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.default,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 160,
    paddingBottom: 80,
  },
  center: { alignItems: "center", gap: 12 },
  logo: { fontSize: 72, lineHeight: 84 },
  title: { textAlign: "center" },
  spinnerWrap: { alignItems: "center", gap: 12 },
  subtitle: { textAlign: "center" },
});
