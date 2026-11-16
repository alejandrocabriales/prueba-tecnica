import styles from './NoUserSelected.module.css'

export function NoUserSelected() {
  return (
    <div className={styles.placeholder}>
      <span className={styles.icon} aria-hidden="true" />
      <h2 className={styles.title}>Select a user</h2>
      <p className={styles.text}>Choose someone from the directory to see their details and posts.</p>
    </div>
  )
}
