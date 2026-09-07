export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: (userId: string | undefined) => [...workspaceKeys.all, userId, "list"] as const,
  detail: (userId: string | undefined, workspaceId: string | undefined) => [...workspaceKeys.all, userId, "detail", workspaceId] as const
};

