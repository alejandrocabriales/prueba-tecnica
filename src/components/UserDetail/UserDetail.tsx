import type { AsyncState } from '../../types/async'
import type { Post } from '../../types/post'
import type { User } from '../../types/user'
import { PostList } from '../PostList/PostList'
import { PostListSkeleton } from '../PostList/PostListSkeleton'
import { EmptyState } from '../StatusMessage/EmptyState'
import { ErrorState } from '../StatusMessage/ErrorState'
import styles from './UserDetail.module.css'

interface UserDetailProps {
  user: User
  postsState: AsyncState<Post[]>
  onRetryPosts: () => void
  onBack: () => void
}

function formatPostCount(count: number): string {
  return count === 1 ? '1 post' : `${String(count)} posts`
}

export function UserDetail({ user, postsState, onRetryPosts, onBack }: UserDetailProps) {
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
        </div>
        {renderPosts()}
      </section>
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
              description={`${user.name} hasn't published anything yet.`}
            />
          )
        }
        return <PostList posts={postsState.data} />
    }
  }
}
