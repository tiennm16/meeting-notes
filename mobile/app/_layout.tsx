import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import * as NativeSplash from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/src/context/AuthProvider";
import { SplashScreen } from "@/src/components/SplashScreen";
import { useAuth } from "@/src/hooks/auth";
import { useDeepLinkRouter } from "@/src/hooks/deepLink";
import { subscribeNotificationTaps } from "@/src/hooks/notifications";
import { STRINGS } from "@/src/constant";

// Keep the native splash visible until React has mounted and we know whether
// the user is authenticated. The JS `<SplashScreen />` then takes over for
// any further loading state.
NativeSplash.preventAutoHideAsync().catch(() => {
  /* already prevented or failed silently — non-fatal */
});

function AuthGate() {
  const { token, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    // Hand control back to the OS as soon as auth is known.
    NativeSplash.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === "login";
    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token && inAuthGroup) {
      router.replace("/");
    }
  }, [token, loading, segments]);

  if (loading) return <SplashScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="meeting/[id]"
        options={{ headerShown: true, title: STRINGS.navigation.meetingTitle }}
      />
    </Stack>
  );
}

function NotificationRouter() {
  useEffect(() => {
    const unsubscribe = subscribeNotificationTaps((path) => {
      router.push(path as never);
    });
    return unsubscribe;
  }, []);

  return null;
}

function DeepLinkRouter() {
  useDeepLinkRouter();
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeepLinkRouter />
      <NotificationRouter />
      <AuthGate />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
