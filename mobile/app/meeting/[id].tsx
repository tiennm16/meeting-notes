import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, Meeting } from "@/src/api";
import { useAuth } from "@/src/hooks/auth";
import { CustomizedText } from "@/src/components/CustomizedText";
import { STRINGS } from "@/src/constant";
import { colors } from "@/src/theme";

export default function MeetingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    try {
      const data = await api.getMeeting(id);
      setMeeting(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !meeting) {
    return (
      <View style={styles.center}>
        <CustomizedText variant="bodySmall" color="error">
          {error ?? STRINGS.meetingDetail.notFound}
        </CustomizedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <CustomizedText variant="h2">
        {meeting.title ?? STRINGS.meetingDetail.untitled}
      </CustomizedText>
      <CustomizedText variant="caption" color="secondary">
        {new Date(meeting.created_at).toLocaleString()}  ·  {meeting.status}
      </CustomizedText>

      {meeting.status === "processing" && (
        <View style={styles.processing}>
          <ActivityIndicator color={colors.text.secondary} />
          <CustomizedText variant="bodySmall" color="secondary">
            {STRINGS.meetingDetail.transcribing}
          </CustomizedText>
        </View>
      )}
      {meeting.transcript && (
        <Section title={STRINGS.meetingDetail.sectionTranscript}>
          <CustomizedText variant="body" color="primary">
            {meeting.transcript}
          </CustomizedText>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <CustomizedText variant="eyebrow" color="accent">
        {title}
      </CustomizedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.default },
  content: { padding: 20, gap: 20 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg.default,
  },
  processing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.bg.surface,
    borderRadius: 8,
  },
  section: { gap: 8 },
});
