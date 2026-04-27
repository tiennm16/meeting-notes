/** Android notification channel ids referenced by `expo-notifications`. */
export const NOTIFICATION_CHANNELS = {
  default: "default",
  recording: "recording",
} as const;

/** Mime / extension assumed for our recordings. */
export const AUDIO_FILE = {
  mimeType: "audio/m4a",
  extension: "m4a",
} as const;
