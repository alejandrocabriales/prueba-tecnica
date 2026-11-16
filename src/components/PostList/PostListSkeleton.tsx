import { cx } from '../../utils/cx'
import styles from './PostList.module.css'

const PLACEHOLDER_POSTS = 3

export function PostListSkeleton() {
  return (
    // Purely visual: the "Loading posts…" announcement lives in the LiveRegion.
    <div aria-hidden="true" className={styles.list}>
      {Array.from({ length: PLACEHOLDER_POSTS }, (_, index) => (
        <div key={index} className={styles.item}>
          <span className={cx(styles.skeletonLine, styles.skeletonTitle)} />
          <span className={styles.skeletonLine} />
          <span className={cx(styles.skeletonLine, styles.skeletonShort)} />
        </div>
      ))}
    </div>
  )
}
