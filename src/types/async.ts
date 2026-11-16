/**
 * Discriminated union for any async resource.
 * Makes impossible states (e.g. loading + error at once) unrepresentable.
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
