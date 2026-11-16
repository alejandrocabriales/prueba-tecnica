import { getUsers } from '../api/users'
import { useFetch } from './useFetch'

export function useUsers() {
  return useFetch({ key: 'users', fetch: getUsers })
}
