import type { PostView } from '../../types/post'
import { cx } from '../../utils/cx'
import styles from './PostList.module.css'

interface PostListProps {
  posts: readonly PostView[]
  highlightedKey?: string | null
}

export function PostList({ posts, highlightedKey = null }: PostListProps) {
  return (
    <ul className={styles.list} aria-label="Posts">
      {posts.map((post) => (
        <li
          key={post.key}
          className={cx(styles.item, post.key === highlightedKey && styles.highlighted)}
        >
          <article>
            <h4 className={styles.title}>{post.title}</h4>
            <p className={styles.body}>{post.body}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}
