import { useMemo } from 'react'
import { getPostsByUser } from '../api/posts'
import type { Post } from '../types/post'
import { type Fetcher, useFetch } from './useFetch'

/**
 * Posts of the selected user. A new `userId` creates a new fetcher identity,
 * so `useFetch` aborts the previous request and ignores its result.
 * `null` (no user selected) means no request at all.
 */
export function usePosts(userId: number | null) {
  const fetcher = useMemo<Fetcher<Post[]> | null>(
    () => (userId === null ? null : (signal) => getPostsByUser(userId, signal)),
    [userId],
  )
  return useFetch(fetcher)
}
