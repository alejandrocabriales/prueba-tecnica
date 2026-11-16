import { useState } from 'react'
import styles from './App.module.css'
import { NoUserSelected } from './components/UserDetail/NoUserSelected'
import { UserDetail } from './components/UserDetail/UserDetail'
import { UserDirectory } from './components/UserDirectory/UserDirectory'
import { useCreatedPosts } from './hooks/useCreatedPosts'
import { usePosts } from './hooks/usePosts'
import { useUsers } from './hooks/useUsers'
import { mergePosts } from './utils/postView'

/** On small screens list and detail are separate views; on desktop both are visible. */
type MobileView = 'list' | 'detail'

function App() {
  const { state: usersState, retry: retryUsers } = useUsers()
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const { state: postsState, retry: retryPosts } = usePosts(selectedUserId)
  const { createdByUser, publishPost } = useCreatedPosts()

  // Derived, not stored: looked up in the full list, so a search that hides
  // the selected user does not close the detail.
  const selectedUser =
    usersState.status === 'success'
      ? (usersState.data.find((user) => user.id === selectedUserId) ?? null)
      : null

  function handleSelectUser(userId: number) {
    setSelectedUserId(userId)
    setMobileView('detail')
  }

  return (
    <div className={styles.layout} data-view={mobileView}>
      <aside className={styles.sidebar}>
        <h1 className={styles.brand}>Directory</h1>
        <UserDirectory
          usersState={usersState}
          onRetry={retryUsers}
          query={query}
          onQueryChange={setQuery}
          selectedUserId={selectedUserId}
          onSelectUser={handleSelectUser}
        />
      </aside>

      <main className={styles.main}>
        {selectedUser ? (
          <UserDetail
            key={selectedUser.id}
            user={selectedUser}
            postsState={mergePosts(postsState, createdByUser[selectedUser.id] ?? [])}
            onRetryPosts={retryPosts}
            onPublishPost={(values) => publishPost(selectedUser.id, values)}
            onBack={() => {
              setMobileView('list')
            }}
          />
        ) : (
          <NoUserSelected />
        )}
      </main>
    </div>
  )
}

export default App
