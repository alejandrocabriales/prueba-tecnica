/** Post as the API sends it. */
export interface Post {
  id: number
  userId: number
  title: string
  body: string
}

export type NewPostInput = Omit<Post, 'id'>

/**
 * Post as the UI renders it. `id` stays whatever the server said
 * (JSONPlaceholder answers `101` for every created post), while `key`
 * is owned by the client and is always unique.
 */
export interface PostView extends Post {
  key: string
}
