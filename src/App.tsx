import { useState } from 'react'
import styles from './App.module.css'
import { UserDirectory } from './components/UserDirectory/UserDirectory'
import { useUsers } from './hooks/useUsers'

function App() {
  const { state: usersState, retry: retryUsers } = useUsers()
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h1 className={styles.brand}>Directory</h1>
        <UserDirectory
          usersState={usersState}
          onRetry={retryUsers}
          query={query}
          onQueryChange={setQuery}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
      </aside>

      <main className={styles.detail}>
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon} aria-hidden="true" />
          <h2 className={styles.placeholderTitle}>Select a user</h2>
          <p className={styles.placeholderText}>
            Choose someone from the directory to see their details and posts.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
