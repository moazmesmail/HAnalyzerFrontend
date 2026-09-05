export const analysisKeys = {
  all: ["analyses"] as const,
  detail: (userId: string | undefined, sessionId: string | undefined) =>
    [...analysisKeys.all, userId, "detail", sessionId] as const,
  results: (userId: string | undefined, sessionId: string | undefined) =>
    [...analysisKeys.all, userId, "results", sessionId] as const,
  usage: (userId: string | undefined, sessionId: string | undefined) =>
    [...analysisKeys.all, userId, "usage", sessionId] as const,
  profiles: () => [...analysisKeys.all, "profiles"] as const,
  video: (userId: string | undefined, videoId: string | undefined) =>
    [...analysisKeys.all, userId, "video", videoId] as const
};
