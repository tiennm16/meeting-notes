import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, Meeting } from "@/src/api";
import { useAuth } from "@/src/hooks/auth";
import { CustomizedButton } from "@/src/components/CustomizedButton";
import { CustomizedText } from "@/src/components/CustomizedText";
import { DEEP_LINKS, STRINGS, TIMING } from "@/src/constant";
import { colors } from "@/src/theme";

function statusColor(status: Meeting["status"]) {
  if (status === "done") return colors.status.success;
  if (status === "error") return colors.status.error;
  return colors.status.warning;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MeetingsScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const list = await api.listMeetings();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const hasProcessing = items.some((m) => m.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(load, TIMING.meetingPollMs);
    return () => clearInterval(interval);
  }, [items, load, isAuthenticated]);

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.text.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <CustomizedText
              variant="bodySmall"
              color="muted"
              style={styles.emptyText}
            >
              {error ?? STRINGS.meetings.empty}
            </CustomizedText>
          </View>
        }
        renderItem={({ item }) => (
          <CustomizedButton
            style={styles.row}
            onPress={() => router.push(DEEP_LINKS.meeting(item.id) as never)}
          >
            <View style={{ flex: 1 }}>
              <CustomizedText variant="h3" numberOfLines={1}>
                {item.title ?? STRINGS.meetings.untitled}
              </CustomizedText>
              <CustomizedText
                variant="caption"
                color="secondary"
                style={styles.subtitle}
              >
                {formatDate(item.created_at)}
              </CustomizedText>
            </View>
            <View
              style={[styles.badge, { backgroundColor: statusColor(item.status) }]}
            >
              <CustomizedText variant="badge" color="onBadge">
                {item.status}
              </CustomizedText>
            </View>
          </CustomizedButton>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.default },
  list: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: "center" },
  empty: { alignItems: "center", padding: 32 },
  emptyText: { textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: 12,
  },
  subtitle: { marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
});
