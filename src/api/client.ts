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
 * fetch() itself failed: no response at all (offline, DNS, CORS…).
 * Wrapping it keeps "network problem" distinct from bugs in our own code,
 * which would otherwise surface as a generic TypeError.
 */
export class NetworkError extends Error {
  constructor(url: string, options: { cause: unknown }) {
    super(`Network request to ${url} failed`, options)
    this.name = 'NetworkError'
  }
}

/**
 * Thin wrapper over fetch:
 * - wraps network failures in NetworkError (aborts are rethrown untouched)
 * - rejects on non-2xx (fetch only rejects on network errors)
 * - returns `unknown` so callers must validate the payload
 */
export async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const url = `${BASE_URL}${path}`
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  let response: Response
  try {
    response = await fetch(url, { ...init, headers })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    throw new NetworkError(url, { cause: error })
  }

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
