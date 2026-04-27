/**
 * All user-facing copy lives here so it's easy to scan, audit, and later i18n.
 * Group keys by screen / feature, not by sentence type.
 */
export const STRINGS = {
  login: {
    title: "Meeting Notes",
    subtitle: "Sign in to continue",
    usernamePlaceholder: "Username",
    passwordPlaceholder: "Password",
    submit: "Log in",
    missingTitle: "Missing info",
    missingBody: "Enter username and password.",
    failedTitle: "Login failed",
    invalidCredentials: "Invalid username or password.",
    genericFailure: "Login failed.",
  },
  record: {
    statusBackground: "Recording — keeps going in the background",
    statusIdle: "Tap to start a new meeting",
    buttonRecord: "Record",
    buttonStop: "Stop",
    buttonUploading: "Uploading…",
    buttonInTransition: "…",
    uploadedTitle: "Uploaded",
    uploadedBody:
      "Your meeting is processing. You will be notified when it is ready.",
    uploadedView: "View",
    uploadedOk: "OK",
    uploadFailedTitle: "Upload failed",
    logout: "Log out",
  },
  meetings: {
    empty: "No meetings yet. Record one from the Record tab.",
    untitled: "Untitled meeting",
  },
  meetingDetail: {
    notFound: "Meeting not found",
    untitled: "Untitled meeting",
    transcribing: "Transcribing your meeting…",
    sectionTranscript: "Transcript",
  },
  tabs: {
    record: "Record",
    meetings: "Meetings",
  },
  navigation: {
    meetingTitle: "Meeting",
  },
  notifications: {
    channelDefaultName: "Meeting updates",
    channelRecordingName: "Recording in progress",
    foregroundFallbackTitle: "Meeting ready",
  },
  splash: {
    logo: "🎙️",
    title: "Meeting Notes",
    subtitle: "Checking your session…",
  },
} as const;
