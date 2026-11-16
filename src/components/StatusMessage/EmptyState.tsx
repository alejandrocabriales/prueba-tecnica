import { type ReactNode, useId } from 'react'
import styles from './StatusMessage.module.css'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

/** Static content: announcements go through the panel's LiveRegion. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  const titleId = useId()
  return (
    <div role="group" aria-labelledby={titleId} className={styles.box}>
      <p id={titleId} className={styles.title}>
        {title}
      </p>
      <p className={styles.description}>{description}</p>
      {action}
    </div>
  )
}
