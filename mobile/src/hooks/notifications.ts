import * as Notifications from "expo-notifications";
import * as ExpoLinking from "expo-linking";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { Alert, Linking, Platform } from "react-native";
import { api } from "@/src/api";
import {
  DEEP_LINKS,
  DEEP_LINK_SCHEME,
  NOTIFICATION_CHANNELS,
  STRINGS,
} from "@/src/constant";

// expo-notifications still handles foreground display + Android channels.
// FCM (via @react-native-firebase/messaging) handles token + delivery + tap routing.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(
    NOTIFICATION_CHANNELS.default,
    {
      name: STRINGS.notifications.channelDefaultName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    },
  );
  await Notifications.setNotificationChannelAsync(
    NOTIFICATION_CHANNELS.recording,
    {
      name: STRINGS.notifications.channelRecordingName,
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: [0],
    },
  );
}

export async function registerForPushNotifications() {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    let currentStatus = status;
    if (currentStatus !== "granted") {
      if (!canAskAgain) {
        Alert.alert(
          "Notifications Blocked",
          "Please enable notifications in your device settings to receive updates.",
          [{ text: "OK", onPress: Linking.openSettings }],
        );
        return;
      }

      // Request permission (handles first request and after denied)
      const response = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      currentStatus = response.status;
    }

    if (currentStatus === "granted") {
      await registerAndUploadPushToken();
    }
  } catch (error) {
    console.error("Failed to register for push notifications:", error);
  }
}

/**
 * Fetch the current FCM token and POST it to /push-token. Safe to call on every login —
 * Firebase caches the token, so this is cheap when nothing has changed.
 *
 * The onTokenRefresh listener is set up once globally in `subscribeMeetingTaps`,
 * not here, so calling this repeatedly does not stack listeners.
 */
export async function registerAndUploadPushToken() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: false,
      }),
    });
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
    const fcmToken = await messaging().getToken();
    await api.registerPushToken(fcmToken);
  } catch (error) {
    console.error("Failed to setup notifications:", error);
  }
}

/**
 * Shape of the data payload we accept from FCM (or a local foreground
 * notification). Any one of these fields is enough to route on tap; if none
 * are present we don't navigate at all.
 *
 *   { path: "/meeting/abc-123" }                       // preferred
 *   { url: "meetingnotes:///meeting/abc-123" }         // also fine
 *   { meeting_id: "abc-123" }                          // legacy convenience
 */
type DeepLinkPayload = {
  path?: string;
  url?: string;
  meeting_id?: string;
};

function dataFromMessage(
  message:
    | FirebaseMessagingTypes.RemoteMessage
    | Notifications.NotificationResponse
    | null,
): DeepLinkPayload | null {
  console.log("🚀 ~ dataFromMessage ~ message:", message);
  if (!message) return null;
  // expo-notifications response (foreground display tap)
  if ((message as Notifications.NotificationResponse)?.notification?.request) {
    return ((message as Notifications.NotificationResponse).notification.request
      .content.data ?? null) as DeepLinkPayload | null;
  }
  // RNFirebase remote message
  return ((message as FirebaseMessagingTypes.RemoteMessage).data ??
    null) as DeepLinkPayload | null;
}

/**
 * Resolve a router-relative path from a notification payload. Returns null
 * when the notification did not specify a destination — caller stays where
 * it is.
 */
export function extractNotificationPath(
  message:
    | FirebaseMessagingTypes.RemoteMessage
    | Notifications.NotificationResponse
    | null,
): string | null {
  const data = dataFromMessage(message);
  console.log("🚀 ~ extractNotificationPath ~ data:", data);
  if (!data) return null;

  if (typeof data.path === "string" && data.path.length > 0) {
    return data.path.startsWith("/") ? data.path : `/${data.path}`;
  }

  if (typeof data.url === "string" && data.url.length > 0) {
    const parsed = ExpoLinking.parse(data.url);
    if (parsed.scheme && parsed.scheme !== DEEP_LINK_SCHEME) return null;
    return parsed.path ? `/${parsed.path}` : "/";
  }

  if (typeof data.meeting_id === "string" && data.meeting_id.length > 0) {
    return DEEP_LINKS.meeting(data.meeting_id);
  }

  return null;
}

export type NotificationTapHandler = (path: string) => void;

/**
 * Subscribe to all four notification-tap entry points and forward the
 * resolved deep-link path (if the payload defined one) to the caller:
 *  - cold start (app launched by tap):       messaging().getInitialNotification
 *  - background → foreground:                messaging().onNotificationOpenedApp
 *  - foreground delivery:                    messaging().onMessage (re-displayed
 *    locally via expo-notifications so the user actually sees it)
 *  - tap on the locally-displayed foreground notification: expo-notifications
 *    response listener
 *
 * If the notification payload has no `path` / `url` / `meeting_id` field,
 * we don't route — the user just dismisses the notification.
 *
 * Also (re-)uploads the FCM token on rotation. Returns an unsubscribe fn.
 */
export function subscribeNotificationTaps(
  onTap: NotificationTapHandler,
): () => void {
  const unsubscribers: Array<() => void> = [];

  const dispatch = (
    message:
      | FirebaseMessagingTypes.RemoteMessage
      | Notifications.NotificationResponse
      | null,
    source: "cold-fcm" | "cold-expo" | "warm" | "foreground-tap",
  ) => {
    const path = extractNotificationPath(message);
    console.log(`[notification:${source}]`, path ?? "(no path)", message);
    if (path) onTap(path);
  };

  // Re-upload the FCM token if Firebase rotates it during this session.
  // Set up once at app launch (not on every login) to avoid stacking listeners.
  unsubscribers.push(
    messaging().onTokenRefresh((next) => {
      api
        .registerPushToken(next)
        .catch((e) => console.warn("Push token refresh upload failed", e));
    }),
  );

  unsubscribers.push(
    messaging().onNotificationOpenedApp((message) => dispatch(message, "warm")),
  );

  // Cold-start: the OS may hand the launch-tap to either FCM or
  // expo-notifications (e.g. when the user tapped a locally-displayed
  // foreground notification after force-closing the app). Check both —
  // whichever has a payload is the one that actually opened the app.
  // The first one to resolve a path wins; the second is logged for debug.
  let coldStartConsumed = false;
  const tryColdStart = (
    message:
      | FirebaseMessagingTypes.RemoteMessage
      | Notifications.NotificationResponse
      | null,
    source: "cold-fcm" | "cold-expo",
  ) => {
    if (coldStartConsumed) {
      console.log(
        `[notification:${source}] (skipped — cold-start already consumed)`,
        message,
      );
      return;
    }
    const path = extractNotificationPath(message);
    if (path) coldStartConsumed = true;
    dispatch(message, source);
  };

  messaging()
    .getInitialNotification()
    .then((message) => tryColdStart(message, "cold-fcm"))
    .catch((e) => console.warn("getInitialNotification failed", e));

  Notifications.getLastNotificationResponseAsync()
    .then((response) => tryColdStart(response, "cold-expo"))
    .catch((e) => console.warn("getLastNotificationResponseAsync failed", e));

  unsubscribers.push(
    messaging().onMessage(async (message) => {
      // Foreground: FCM does not show anything itself. Surface a local
      // notification carrying the same data so the response listener can
      // route the tap.
      const title =
        message.notification?.title ??
        STRINGS.notifications.foregroundFallbackTitle;
      const body = message.notification?.body ?? "";
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: message.data ?? {} },
        trigger: null,
      });
    }),
  );

  const respSub = Notifications.addNotificationResponseReceivedListener(
    (response) => dispatch(response, "foreground-tap"),
  );
  unsubscribers.push(() => respSub.remove());

  return () => unsubscribers.forEach((fn) => fn());
}
