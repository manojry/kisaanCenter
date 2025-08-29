
import { useQuery, UseQueryOptions } from 'react-query';
import { useMemo } from 'react';

interface OptimizedQueryOptions<T> extends UseQueryOptions<T> {
  enablePagination?: boolean;
  enableInfiniteScroll?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  const {
    enablePagination = false,
    enableInfiniteScroll = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000,  // 1 minute
    ...queryOptions
  } = options;

  const optimizedOptions = useMemo(() => ({
    ...queryOptions,
    cacheTime,
    staleTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  }), [queryOptions, cacheTime, staleTime]);

  return useQuery(queryKey, queryFn, optimizedOptions);
}
