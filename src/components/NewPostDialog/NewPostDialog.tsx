import { type SubmitEvent, useId, useLayoutEffect, useRef, useState } from 'react'
import { toUserMessage } from '../../utils/toUserMessage'
import { type PostFormErrors, type PostFormValues, validatePost } from '../../utils/validatePost'
import styles from './NewPostDialog.module.css'

interface NewPostDialogProps {
  authorName: string
  onCancel: () => void
  /** Resolves when the post is saved (the parent then unmounts the dialog); rejects on failure. */
  onSubmit: (values: PostFormValues) => Promise<void>
}

const EMPTY_VALUES: PostFormValues = { title: '', body: '' }

/**
 * Native <dialog> opened with showModal(): the browser makes the rest of the
 * page inert, traps focus, closes on Esc and restores focus to the opener.
 * It is mounted only while open, so form state resets on every opening.
 */
export function NewPostDialog({ authorName, onCancel, onSubmit }: NewPostDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const ids = useId()
  const headingId = `${ids}-heading`
  const titleErrorId = `${ids}-title-error`
  const bodyErrorId = `${ids}-body-error`

  const [values, setValues] = useState<PostFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<PostFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Layout effect: open before paint, and close() in the cleanup runs before
  // the element leaves the DOM, so the browser can restore focus to the opener.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }
    dialog.showModal()
    return () => {
      dialog.close()
    }
  }, [])

  function handleChange(field: keyof PostFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    // Typing clears only this field's error.
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const fieldErrors = validatePost(values)
    setErrors(fieldErrors)
    if (fieldErrors.title !== undefined) {
      titleRef.current?.focus()
      return
    }
    if (fieldErrors.body !== undefined) {
      bodyRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({ title: values.title.trim(), body: values.body.trim() })
    } catch (error) {
      // Keep what the user typed so they can retry.
      setSubmitError(toUserMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={headingId}
      onCancel={(event) => {
        // Esc: we decide, not the browser. Never close mid-request.
        event.preventDefault()
        if (!isSubmitting) {
          onCancel()
        }
      }}
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <header className={styles.header}>
          <h2 id={headingId} className={styles.title}>
            New post
          </h2>
          <p className={styles.subtitle}>
            Posting as {authorName}. <span className={styles.required}>* Required</span>
          </p>
        </header>

        <div className={styles.field}>
          <label htmlFor={`${ids}-title`} className={styles.label}>
            Title <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <input
            ref={titleRef}
            id={`${ids}-title`}
            className={styles.input}
            placeholder="Give your post a title"
            required
            value={values.title}
            aria-invalid={errors.title !== undefined}
            aria-describedby={errors.title !== undefined ? titleErrorId : undefined}
            onChange={(event) => {
              handleChange('title', event.target.value)
            }}
          />
          {errors.title !== undefined && (
            <p id={titleErrorId} role="alert" className={styles.error}>
              {errors.title}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${ids}-body`} className={styles.label}>
            Body <span className={styles.required} aria-hidden="true">*</span>
          </label>
          <textarea
            ref={bodyRef}
            id={`${ids}-body`}
            className={styles.input}
            placeholder="Write the content of your post"
            rows={6}
            required
            value={values.body}
            aria-invalid={errors.body !== undefined}
            aria-describedby={errors.body !== undefined ? bodyErrorId : undefined}
            onChange={(event) => {
              handleChange('body', event.target.value)
            }}
          />
          {errors.body !== undefined && (
            <p id={bodyErrorId} role="alert" className={styles.error}>
              {errors.body}
            </p>
          )}
        </div>

        {submitError !== null && (
          <p role="alert" className={styles.submitError}>
            We couldn't publish your post. {submitError}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className="button" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing…' : 'Publish post'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
