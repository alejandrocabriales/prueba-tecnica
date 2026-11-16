import { useEffect, useState } from 'react'
import type { AsyncState } from '../../types/async'
import type { PostView } from '../../types/post'
import type { User } from '../../types/user'
import { cx } from '../../utils/cx'
import type { PostFormValues } from '../../utils/validatePost'
import { NewPostDialog } from '../NewPostDialog/NewPostDialog'
import { PostList } from '../PostList/PostList'
import { PostListSkeleton } from '../PostList/PostListSkeleton'
import { EmptyState } from '../StatusMessage/EmptyState'
import { ErrorState } from '../StatusMessage/ErrorState'
import styles from './UserDetail.module.css'

const SUCCESS_MESSAGE_MS = 4000

interface UserDetailProps {
  user: User
  postsState: AsyncState<PostView[]>
  onRetryPosts: () => void
  onPublishPost: (values: PostFormValues) => Promise<PostView>
  onBack: () => void
}

function formatPostCount(count: number): string {
  return count === 1 ? '1 post' : `${String(count)} posts`
}

/**
 * Rendered with `key={user.id}` by App: switching user remounts it, so the
 * dialog and the success message never leak from one user to another.
 */
export function UserDetail({
  user,
  postsState,
  onRetryPosts,
  onPublishPost,
  onBack,
}: UserDetailProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [lastPublishedKey, setLastPublishedKey] = useState<string | null>(null)

  useEffect(() => {
    if (lastPublishedKey === null) {
      return
    }
    const timeoutId = setTimeout(() => {
      setLastPublishedKey(null)
    }, SUCCESS_MESSAGE_MS)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [lastPublishedKey])

  async function handleSubmit(values: PostFormValues) {
    const post = await onPublishPost(values)
    setIsDialogOpen(false)
    setLastPublishedKey(post.key)
  }

  const openDialog = () => {
    setIsDialogOpen(true)
  }

  return (
    <article className={styles.detail} aria-labelledby="user-detail-name">
      <button type="button" className={styles.back} onClick={onBack}>
        <span aria-hidden="true">←</span> Back to users
      </button>

      <header className={styles.header}>
        <div className={styles.identity}>
          <p className={styles.eyebrow}>User</p>
          <h2 id="user-detail-name" className={styles.name}>
            {user.name}
          </h2>
          <a className={styles.email} href={`mailto:${user.email}`}>
            {user.email}
          </a>
        </div>
        <p className={styles.company}>
          <span className={styles.companyName}>{user.companyName}</span>
          <span className={styles.companyLabel}>Company</span>
        </p>
      </header>

      <section className={styles.posts} aria-labelledby="posts-heading">
        <div className={styles.postsHeader}>
          <h3 id="posts-heading" className={styles.postsTitle}>
            Posts
          </h3>
          {postsState.status === 'success' && (
            <span className={styles.count}>{formatPostCount(postsState.data.length)}</span>
          )}
          <button
            type="button"
            className={cx('button', 'button-primary', styles.newPost)}
            onClick={openDialog}
          >
            New post
          </button>
        </div>

        {/* Always mounted so screen readers announce changes reliably. */}
        <p role="status" className={styles.success}>
          {lastPublishedKey !== null && (
            <>
              <span className={styles.successDot} aria-hidden="true" />
              Post published
              <span className={styles.successTime}>Just now</span>
            </>
          )}
        </p>

        {renderPosts()}
      </section>

      {isDialogOpen && (
        <NewPostDialog
          authorName={user.name}
          onCancel={() => {
            setIsDialogOpen(false)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </article>
  )

  function renderPosts() {
    switch (postsState.status) {
      case 'idle':
      case 'loading':
        return <PostListSkeleton />
      case 'error':
        return (
          <ErrorState
            title="We couldn't load posts"
            message={postsState.error}
            onRetry={onRetryPosts}
          />
        )
      case 'success':
        if (postsState.data.length === 0) {
          return (
            <EmptyState
              title="No posts yet"
              description={`${user.name} hasn't published anything yet. Create the first one.`}
              action={
                <button type="button" className="button button-primary" onClick={openDialog}>
                  Write the first post
                </button>
              }
            />
          )
        }
        return <PostList posts={postsState.data} highlightedKey={lastPublishedKey} />
    }
  }
}
