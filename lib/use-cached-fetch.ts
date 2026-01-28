import useSWR, { SWRConfiguration } from "swr"

interface UseCachedFetchOptions extends SWRConfiguration {
  // Skip fetching if condition is false
  enabled?: boolean
}

/**
 * Custom hook for cached data fetching using SWR
 * Default cache duration is 60 seconds (configured in SWRProvider)
 *
 * @param url - API endpoint to fetch
 * @param options - SWR options + enabled flag
 * @returns { data, error, isLoading, isValidating, mutate }
 */
export function useCachedFetch<T = unknown>(
  url: string | null,
  options: UseCachedFetchOptions = {}
) {
  const { enabled = true, ...swrOptions } = options

  // If not enabled or no URL, don't fetch
  const shouldFetch = enabled && url

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    shouldFetch ? url : null,
    swrOptions
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    // Manual refresh function - bypasses cache
    refresh: () => mutate(),
    // Optimistic update function
    mutate,
  }
}

/**
 * Hook for fetching Notion data with caching
 */
export function useNotionData<T = unknown>(
  endpoint: string,
  databaseId: string | undefined,
  options: UseCachedFetchOptions = {}
) {
  const url = databaseId
    ? `/api/notion/${endpoint}?databaseId=${databaseId}`
    : null

  return useCachedFetch<T>(url, {
    enabled: !!databaseId,
    ...options,
  })
}

/**
 * Hook for fetching GitHub data with caching
 */
export function useGitHubData<T = unknown>(
  owner: string | undefined,
  repo: string | undefined,
  options: UseCachedFetchOptions = {}
) {
  const url =
    owner && repo ? `/api/github/repo?owner=${owner}&repo=${repo}` : null

  return useCachedFetch<T>(url, {
    enabled: !!owner && !!repo,
    ...options,
  })
}

/**
 * Hook for fetching Google Drive data with caching
 */
export function useDriveData<T = unknown>(
  folderId: string | undefined,
  options: UseCachedFetchOptions = {}
) {
  const url = folderId ? `/api/drive/files?folderId=${folderId}` : null

  return useCachedFetch<T>(url, {
    enabled: !!folderId,
    ...options,
  })
}
