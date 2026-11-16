import type { NewPostInput, Post } from '../types/post'
import { fetchJson } from './client'
import { isRecord, ParseError, parseArray, readNumber, readString } from './parse'

function parsePost(data: unknown): Post {
  if (!isRecord(data)) {
    throw new ParseError('Expected a post object')
  }
  return {
    id: readNumber(data, 'id'),
    userId: readNumber(data, 'userId'),
    title: readString(data, 'title'),
    body: readString(data, 'body'),
  }
}

export async function getPostsByUser(userId: number, signal?: AbortSignal): Promise<Post[]> {
  const params = new URLSearchParams({ userId: String(userId) })
  const data = await fetchJson(`/posts?${params.toString()}`, { signal })
  return parseArray(data, parsePost)
}

/**
 * Note: JSONPlaceholder does not persist and always answers with `id: 101`.
 * Uniqueness on the client is handled in the view layer, not here.
 */
export async function createPost(input: NewPostInput): Promise<Post> {
  const data = await fetchJson('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(input),
  })
  return parsePost(data)
}
