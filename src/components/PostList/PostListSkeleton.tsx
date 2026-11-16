import { cx } from '../../utils/cx'
import styles from './PostList.module.css'

const PLACEHOLDER_POSTS = 3

export function PostListSkeleton() {
  return (
    <div role="status" aria-label="Loading posts" className={styles.list}>
      {Array.from({ length: PLACEHOLDER_POSTS }, (_, index) => (
        <div key={index} className={styles.item} aria-hidden="true">
          <span className={cx(styles.skeletonLine, styles.skeletonTitle)} />
          <span className={styles.skeletonLine} />
          <span className={cx(styles.skeletonLine, styles.skeletonShort)} />
        </div>
      ))}
    </div>
  )
}
