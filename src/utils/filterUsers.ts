import type { User } from '../types/user'

/** Case- and accent-insensitive: "jose" matches "José". */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().trim()
}

export function filterUsersByName(users: readonly User[], query: string): readonly User[] {
  const needle = normalizeText(query)
  if (needle === '') {
    return users
  }
  return users.filter((user) => normalizeText(user.name).includes(needle))
}
