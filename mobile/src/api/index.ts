import axios, { AxiosError, AxiosInstance } from "axios";
import Constants from "expo-constants";
import { API_PATHS, TIMING } from "@/src/constant";

const baseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? "";

export type Meeting = {
  id: string;
  user_id: string;
  title: string | null;
  status: "processing" | "done" | "error";
  audio_url: string | null;
  transcript: string | null;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
};

export type LoginResponse = {
  access_token: string;
  user: User;
};

export type CreateMeetingResponse = {
  meeting_id: string;
  status: Meeting["status"];
};

export const client: AxiosInstance = axios.create({
  baseURL,
  timeout: TIMING.apiTimeoutMs,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

export function setAuthToken(token: string | null): void {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function unwrap(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ detail?: string }>;
    const status = ax.response?.status ?? 0;
    const message = ax.response?.data?.detail ?? ax.message ?? "Network error";
    throw new ApiError(status, message);
  }
  throw error as Error;
}

export const api = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const res = await client.post<LoginResponse>(API_PATHS.auth.login, {
        email: username,
        password,
      });
      return res.data;
    } catch (e) {
      unwrap(e);
    }
  },

  registerPushToken: async (pushToken: string): Promise<void> => {
    try {
      const response = await client.post(API_PATHS.auth.pushToken, {
        push_token: pushToken,
      });
    } catch (e) {
      unwrap(e);
    }
  },

  uploadMeeting: async (
    audio: { uri: string; name: string; type: string },
    title?: string,
  ): Promise<CreateMeetingResponse> => {
    const form = new FormData();
    form.append("audio", audio as unknown as Blob);
    if (title) form.append("title", title);
    try {
      const res = await client.post<CreateMeetingResponse>(
        API_PATHS.meetings,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data;
    } catch (e) {
      unwrap(e);
    }
  },

  listMeetings: async (): Promise<Meeting[]> => {
    try {
      const res = await client.get<Meeting[]>(API_PATHS.meetings);
      return res.data;
    } catch (e) {
      unwrap(e);
    }
  },

  getMeeting: async (id: string): Promise<Meeting> => {
    try {
      const res = await client.get<Meeting>(API_PATHS.meetingById(id));
      return res.data;
    } catch (e) {
      unwrap(e);
    }
  },
};
