import type { AsyncState } from '../../types/async'
import type { User } from '../../types/user'
import { filterUsersByName } from '../../utils/filterUsers'
import { SearchInput } from '../SearchInput/SearchInput'
import { EmptyState } from '../StatusMessage/EmptyState'
import { ErrorState } from '../StatusMessage/ErrorState'
import { UserList } from '../UserList/UserList'
import { UserListSkeleton } from '../UserList/UserListSkeleton'
import styles from './UserDirectory.module.css'

interface UserDirectoryProps {
  usersState: AsyncState<User[]>
  onRetry: () => void
  query: string
  onQueryChange: (query: string) => void
  selectedUserId: number | null
  onSelectUser: (userId: number) => void
}

export function UserDirectory({
  usersState,
  onRetry,
  query,
  onQueryChange,
  selectedUserId,
  onSelectUser,
}: UserDirectoryProps) {
  return (
    <section className={styles.directory} aria-labelledby="users-heading">
      <h2 id="users-heading" className={styles.heading}>
        Users
      </h2>
      <SearchInput
        label="Search users by name"
        placeholder="Search users..."
        value={query}
        onChange={onQueryChange}
      />
      {renderContent()}
    </section>
  )

  function renderContent() {
    switch (usersState.status) {
      case 'idle':
      case 'loading':
        return <UserListSkeleton />
      case 'error':
        return (
          <ErrorState
            title="We couldn't load users"
            message={usersState.error}
            onRetry={onRetry}
          />
        )
      case 'success': {
        if (usersState.data.length === 0) {
          return <EmptyState title="No users yet" description="The directory is empty." />
        }
        const visibleUsers = filterUsersByName(usersState.data, query)
        if (visibleUsers.length === 0) {
          return (
            <EmptyState
              title={`No users match "${query.trim()}"`}
              description="Try a different name, or clear the search to see everyone."
              action={
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    onQueryChange('')
                  }}
                >
                  Clear search
                </button>
              }
            />
          )
        }
        return (
          <UserList
            users={visibleUsers}
            selectedUserId={selectedUserId}
            onSelect={onSelectUser}
          />
        )
      }
    }
  }
}
