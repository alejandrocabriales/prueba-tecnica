import type { Post } from '../../types/post'
import styles from './PostList.module.css'

interface PostListProps {
  posts: readonly Post[]
}

export function PostList({ posts }: PostListProps) {
  return (
    <ul className={styles.list} aria-label="Posts">
      {posts.map((post) => (
        <li key={post.id} className={styles.item}>
          <article>
            <h4 className={styles.title}>{post.title}</h4>
            <p className={styles.body}>{post.body}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}
