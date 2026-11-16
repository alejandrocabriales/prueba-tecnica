export interface Post {
  id: number
  userId: number
  title: string
  body: string
}

export type NewPostInput = Omit<Post, 'id'>
