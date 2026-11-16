import { HttpError } from '../api/client'
import { ParseError } from '../api/parse'

/** Maps technical errors to copy the user can act on. */
export function toUserMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return `The server responded with an error (${String(error.status)}). Please try again.`
  }
  if (error instanceof ParseError) {
    return 'The server sent an unexpected response. Please try again later.'
  }
  if (error instanceof TypeError) {
    // fetch rejects with TypeError on network failures
    return 'Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
