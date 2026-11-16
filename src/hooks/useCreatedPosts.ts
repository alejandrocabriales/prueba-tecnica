import { useCallback, useState } from 'react'
import { createPost } from '../api/posts'
import type { PostView } from '../types/post'
import { toLocalPostView } from '../utils/postView'
import type { PostFormValues } from '../utils/validatePost'

type CreatedPostsByUser = Readonly<Record<number, readonly PostView[]>>

/**
 * JSONPlaceholder does not persist posts, so created posts are kept here,
 * per user, for the whole session. Lives in App so it survives user changes.
 */
export function useCreatedPosts() {
  const [createdByUser, setCreatedByUser] = useState<CreatedPostsByUser>({})

  const publishPost = useCallback(
    async (userId: number, values: PostFormValues): Promise<PostView> => {
      const saved = await createPost({ userId, ...values })
      const post = toLocalPostView(saved)
      setCreatedByUser((current) => ({
        ...current,
        [userId]: [post, ...(current[userId] ?? [])],
      }))
      return post
    },
    [],
  )

  return { createdByUser, publishPost }
}
