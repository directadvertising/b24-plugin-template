/**
 * TanStack Query keys for the `home` feature.
 *
 * `all` is the feature root — invalidate it to refetch everything in this
 * feature: `queryClient.invalidateQueries({ queryKey: homeKeys.all })`.
 * Each entry below extends `all` so a single root invalidation cascades.
 */
export const homeKeys = {
  all: ["home"] as const,
  health: () => [...homeKeys.all, "health"] as const,
};
