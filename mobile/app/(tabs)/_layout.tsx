import { Tabs } from "expo-router";
import { STRINGS } from "@/src/constant";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "white" },
        headerTitleStyle: { color: "#0f172a" },
        headerTintColor: "#f8fafc",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#1e293b",
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 14},
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#94a3b8",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: STRINGS.tabs.record, tabBarIconStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="meetings"
        options={{ title: STRINGS.tabs.meetings, tabBarIconStyle: { display: "none" } }}
      />
    </Tabs>
  );
}
