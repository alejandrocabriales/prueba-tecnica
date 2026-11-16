import type { User } from '../../types/user'
import { getInitials } from '../../utils/getInitials'
import { userButtonId } from '../../utils/userDomIds'
import styles from './UserList.module.css'

interface UserListProps {
  users: readonly User[]
  selectedUserId: number | null
  onSelect: (userId: number) => void
}

export function UserList({ users, selectedUserId, onSelect }: UserListProps) {
  return (
    <ul className={styles.list} aria-label="Users">
      {users.map((user) => {
        const isSelected = user.id === selectedUserId
        return (
          <li key={user.id}>
            <button
              id={userButtonId(user.id)}
              type="button"
              className={styles.item}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => {
                onSelect(user.id)
              }}
            >
              <span className={styles.avatar} aria-hidden="true">
                {getInitials(user.name)}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.email}>{user.email}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
