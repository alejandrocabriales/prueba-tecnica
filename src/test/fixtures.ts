import type { Post } from '../types/post'
import type { User } from '../types/user'

export const users: User[] = [
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'Sincere@april.biz', companyName: 'Romaguera-Crona' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'Shanna@melissa.tv', companyName: 'Deckow-Crist' },
  { id: 3, name: 'Clementine Bauch', username: 'Samantha', email: 'Nathan@yesenia.net', companyName: 'Romaguera-Jacobson' },
  { id: 4, name: 'José Pérez', username: 'jperez', email: 'jose@example.com', companyName: 'Acme' },
]

export const postsByUser: Record<number, Post[]> = {
  1: [
    { id: 1, userId: 1, title: 'Leanne first post', body: 'Body of Leanne first post' },
    { id: 2, userId: 1, title: 'Leanne second post', body: 'Body of Leanne second post' },
  ],
  2: [{ id: 11, userId: 2, title: 'Ervin only post', body: 'Body of Ervin only post' }],
  3: [],
}

export function postsOf(userId: number): Post[] {
  return postsByUser[userId] ?? []
}

/** Users in the shape the API sends (nested `company`), for mocked responses. */
export const apiUsers = users.map(({ companyName, ...rest }) => ({
  ...rest,
  company: { name: companyName },
}))
