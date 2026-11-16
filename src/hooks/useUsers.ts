import { getUsers } from '../api/users'
import { useFetch } from './useFetch'

/** `getUsers` is a module-level function, so its identity is stable. */
export function useUsers() {
  return useFetch(getUsers)
}
