import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { api, ApiError } from "@/src/api";
import { useAuth } from "@/src/hooks/auth";
import { useRecorder } from "@/src/hooks/recorder";
import { CustomizedButton } from "@/src/components/CustomizedButton";
import { CustomizedText } from "@/src/components/CustomizedText";
import { AUDIO_FILE, DEEP_LINKS, STRINGS } from "@/src/constant";
import { colors } from "@/src/theme";

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordScreen() {
  const { isAuthenticated, logout } = useAuth();
  const { status, error, isRecording, durationMs, start, stop } = useRecorder();
  const [uploading, setUploading] = useState(false);

  const onToggle = async () => {
    if (!isAuthenticated) return;
    if (status === "idle" || status === "error") {
      await start();
      return;
    }
    if (status === "recording") {
      const result = await stop();
      if (!result) return;

      setUploading(true);
      try {
        const filename = `meeting-${Date.now()}.${AUDIO_FILE.extension}`;
        const { meeting_id } = await api.uploadMeeting(
          { uri: result.uri, name: filename, type: AUDIO_FILE.mimeType },
          new Date().toLocaleString(),
        );
        Alert.alert(STRINGS.record.uploadedTitle, STRINGS.record.uploadedBody, [
          {
            text: STRINGS.record.uploadedView,
            onPress: () => router.push(DEEP_LINKS.meeting(meeting_id) as never),
          },
          { text: STRINGS.record.uploadedOk },
        ]);
      } catch (e) {
        const msg =
          e instanceof ApiError ? `${e.status}: ${e.message}` : String(e);
        Alert.alert(STRINGS.record.uploadFailedTitle, msg);
      } finally {
        setUploading(false);
      }
    }
  };

  const buttonLabel = uploading
    ? STRINGS.record.buttonUploading
    : status === "recording"
      ? STRINGS.record.buttonStop
      : status === "preparing" || status === "stopping"
        ? STRINGS.record.buttonInTransition
        : STRINGS.record.buttonRecord;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomizedText variant="display">
          {isRecording ? formatDuration(durationMs) : "00:00"}
        </CustomizedText>
        <CustomizedText
          variant="bodySmall"
          color="secondary"
          style={styles.statusText}
        >
          {error
            ? error
            : isRecording
              ? STRINGS.record.statusBackground
              : STRINGS.record.statusIdle}
        </CustomizedText>
      </View>

      <CustomizedButton
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
        ]}
        onPress={onToggle}
        loading={uploading}
        disabled={status === "preparing" || status === "stopping"}
      >
        <CustomizedText variant="buttonLarge" color="onAccent">
          {buttonLabel}
        </CustomizedText>
      </CustomizedButton>

      <CustomizedButton variant="ghost" size="sm" onPress={logout}>
        <CustomizedText variant="bodySmall" color="muted">
          {STRINGS.record.logout}
        </CustomizedText>
      </CustomizedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.default,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 32,
    paddingTop: 80,
    paddingBottom: 64,
  },
  header: { alignItems: "center", gap: 8 },
  statusText: { textAlign: "center" },
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.status.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: {
    backgroundColor: colors.bg.surface,
    borderWidth: 4,
    borderColor: colors.status.danger,
  },
});
