import type { AsyncState } from '../types/async'
import type { Post, PostView } from '../types/post'

export function toRemotePostView(post: Post): PostView {
  return { ...post, key: `remote-${String(post.id)}` }
}

/** Created posts get a client-side key: the API repeats `id: 101`. */
export function toLocalPostView(post: Post): PostView {
  return { ...post, key: `local-${crypto.randomUUID()}` }
}

/**
 * Locally created posts go first (newest first), then the remote ones.
 * Only merged once the remote request succeeded; loading/error pass through.
 */
export function mergePosts(
  remote: AsyncState<Post[]>,
  created: readonly PostView[],
): AsyncState<PostView[]> {
  if (remote.status !== 'success') {
    return remote
  }
  return { status: 'success', data: [...created, ...remote.data.map(toRemotePostView)] }
}
