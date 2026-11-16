import { cx } from '../../utils/cx'
import styles from './UserList.module.css'

const PLACEHOLDER_ROWS = 4

export function UserListSkeleton() {
  return (
    <div role="status" aria-label="Loading users" className={styles.list}>
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
        <div key={index} className={styles.skeletonRow} aria-hidden="true">
          <span className={cx(styles.avatar, styles.shimmer)} />
          <span className={styles.text}>
            <span className={cx(styles.skeletonLine, styles.shimmer)} />
            <span className={cx(styles.skeletonLine, styles.skeletonLineShort, styles.shimmer)} />
          </span>
        </div>
      ))}
    </div>
  )
}
