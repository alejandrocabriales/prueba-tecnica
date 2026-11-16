export const BASE_URL = 'https://jsonplaceholder.typicode.com'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, url: string) {
    super(`Request to ${url} failed with status ${String(status)}`)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * Thin wrapper over fetch:
 * - rejects on non-2xx (fetch only rejects on network errors)
 * - returns `unknown` so callers must validate the payload
 */
export async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const url = `${BASE_URL}${path}`
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  const response = await fetch(url, { ...init, headers })
  if (!response.ok) {
    throw new HttpError(response.status, url)
  }

  const data: unknown = await response.json()
  return data
}

/** Aborted requests are expected (user changed selection), not failures. */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}
