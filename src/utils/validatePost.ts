export interface PostFormValues {
  title: string
  body: string
}

export type PostFormErrors = Partial<Record<keyof PostFormValues, string>>

/** Whitespace-only input counts as empty. */
export function validatePost(values: PostFormValues): PostFormErrors {
  const errors: PostFormErrors = {}
  if (values.title.trim() === '') {
    errors.title = 'Title is required.'
  }
  if (values.body.trim() === '') {
    errors.body = 'Body is required.'
  }
  return errors
}
