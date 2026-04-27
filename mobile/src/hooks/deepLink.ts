import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { DEEP_LINK_SCHEME } from "@/src/constant";

export type DeepLinkHandler = (url: string) => void;

/**
 * Wires `expo-linking` events into expo-router. expo-router already routes
 * inbound URLs automatically, so this hook only adds:
 *   - logging (helps debug what the OS hands the app)
 *   - a custom-handler hook for callers that want to side-effect on every URL
 *     (e.g. analytics, breadcrumbs, redirect overrides)
 *
 * Cold-start URLs are read once from `getInitialURL()` and warm URLs from the
 * `'url'` event listener. Both go through the same dispatch path.
 */
export function useDeepLinkRouter(extra?: DeepLinkHandler) {
  useEffect(() => {
    let cancelled = false;

    const dispatch = (url: string | null, source: "cold" | "warm") => {
      if (!url) return;
      console.log(`[deepLink:${source}]`, url);
      extra?.(url);

      // Custom-scheme URLs (meetingnotes://meeting/abc) need the path extracted
      // before passing to router.push. expo-router parses them on cold start
      // automatically, but on warm receipt we route explicitly so the user
      // sees the new screen even if expo-router has already restored state.
      const parsed = Linking.parse(url);
      const path = parsed.path ? `/${parsed.path}` : "/";
      if (source === "warm" && parsed.scheme === DEEP_LINK_SCHEME) {
        router.push(path as never);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (cancelled) return;
      dispatch(url, "cold");
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      dispatch(url, "warm");
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [extra]);
}
