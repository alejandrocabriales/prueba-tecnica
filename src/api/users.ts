import type { User } from '../types/user'
import { fetchJson } from './client'
import { isRecord, ParseError, parseArray, readNumber, readRecord, readString } from './parse'

function parseUser(data: unknown): User {
  if (!isRecord(data)) {
    throw new ParseError('Expected a user object')
  }
  return {
    id: readNumber(data, 'id'),
    name: readString(data, 'name'),
    username: readString(data, 'username'),
    email: readString(data, 'email'),
    companyName: readString(readRecord(data, 'company'), 'name'),
  }
}

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const data = await fetchJson('/users', { signal })
  return parseArray(data, parseUser)
}
