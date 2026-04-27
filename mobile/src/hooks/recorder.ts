import { useCallback, useRef, useState } from "react";
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingSource,
  RecordingOptions,
} from "expo-audio";
import { TIMING } from "@/src/constant";

export type RecordingResult = {
  uri: string;
  durationMs: number;
};

export type RecorderStatus =
  | "idle"
  | "preparing"
  | "recording"
  | "stopping"
  | "error";

const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    audioSource: "voice_recognition",
  },
};

export function useRecorder() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const state = useAudioRecorderState(recorder, TIMING.recorderStatePollMs);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setStatus("preparing");
    try {
      // 1. Permission. Check first so we don't trigger the prompt twice.
      const existing = await getRecordingPermissionsAsync();
      const perm = existing.granted
        ? existing
        : await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone permission denied");
        setStatus("error");
        return;
      }

      // 2. Audio mode. Awaited inline (not in a useEffect) so it can't race the tap.
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        shouldPlayInBackground: false,
        allowsBackgroundRecording: true,
        interruptionMode: "doNotMix",
        shouldRouteThroughEarpiece: false,
      });

      // 3. Prepare + record.
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      setStatus("recording");
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error("[recorder.start]", msg, e);
      setError(msg);
      setStatus("error");
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    try {
      setStatus("stopping");
      await recorder.stop();
      const uri = recorder.uri;
      const durationMs = startedAt.current ? Date.now() - startedAt.current : 0;
      startedAt.current = null;
      setStatus("idle");
      if (!uri) {
        setError("Recording finished but no file URI was returned");
        return null;
      }
      console.log("[recorder.stop]", { uri, durationMs });
      return { uri, durationMs };
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error("[recorder.stop]", msg, e);
      setError(msg);
      setStatus("error");
      return null;
    }
  }, [recorder]);

  return {
    status,
    error,
    isRecording: state.isRecording,
    durationMs: state.durationMillis ?? 0,
    start,
    stop,
  };
}
