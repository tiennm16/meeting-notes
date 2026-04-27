/** Custom URL scheme registered in app.config.ts. */
export const DEEP_LINK_SCHEME = "meetingnotes";

/**
 * Routes used by the app, keyed by feature. Keep these as functions so callers
 * pass the dynamic ids and the path-building stays in one place.
 */
export const DEEP_LINKS = {
  /** Tab — record screen (also the home route). */
  home: () => "/",
  /** Tab — list of meetings. */
  meetings: () => "/meetings",
  /** Detail screen target for FCM payloads + external taps. */
  meeting: (id: string) => `/meeting/${id}`,
  /** Auth screen. */
  login: () => "/login",
} as const;

/** Build a fully-qualified custom-scheme URL — used for testing / sharing. */
export function buildDeepLink(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${DEEP_LINK_SCHEME}://${normalized}`;
}
