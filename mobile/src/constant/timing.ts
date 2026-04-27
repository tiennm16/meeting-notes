/** Time-based constants used across the app, all expressed in milliseconds. */
export const TIMING = {
  /** Window during which a CustomizedButton drops repeated taps. */
  buttonThrottleMs: 500,
  /** How often the recorder publishes its in-progress state to the UI. */
  recorderStatePollMs: 500,
  /** Polling cadence on screens that watch a meeting status flip to `done`. */
  meetingPollMs: 5000,
  /** Network timeout for axios requests. */
  apiTimeoutMs: 30_000,
} as const;
