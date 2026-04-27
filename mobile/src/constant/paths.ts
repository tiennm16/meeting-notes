export const API_PATHS = {
  auth: {
    login: "/auth/login",
    pushToken: "/push-token",
  },
  meetings: "/meetings",
  meetingById: (id: string) => `/meetings/${id}`,
} as const;
