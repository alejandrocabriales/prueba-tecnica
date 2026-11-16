import { getPostsByUser } from '../api/posts'
import { useFetch } from './useFetch'

/**
 * Posts of the selected user. A new `userId` means a new key, so `useFetch`
 * aborts the previous request and ignores its result.
 * `null` (no user selected) means no request at all.
 */
export function usePosts(userId: number | null) {
  return useFetch(
    userId === null
      ? null
      : {
          key: `posts:${String(userId)}`,
          fetch: (signal) => getPostsByUser(userId, signal),
        },
  )
}
