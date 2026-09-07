export const videoKeys = {
  all: ["videos"] as const,
  list: (userId: string | undefined) => [...videoKeys.all, userId, "list"] as const,
  archive: (userId: string | undefined) => [...videoKeys.all, userId, "archive"] as const,
  detail: (userId: string | undefined, videoId: string | undefined) =>
    [...videoKeys.all, userId, "detail", videoId] as const
};
