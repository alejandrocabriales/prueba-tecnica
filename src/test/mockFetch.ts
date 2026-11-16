import { vi } from 'vitest'

export type MockHandler = (request: { url: URL; init?: RequestInit }) => Response | Promise<Response>

/** Builds a JSON Response. Create a new one per call: a body can only be read once. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** A promise the test resolves by hand, to simulate a slow response. */
export function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

/**
 * Replaces global fetch with a router keyed by "METHOD /path?query".
 * - Unknown routes reject loudly so a test never hits the real network.
 * - Like real fetch, an aborted signal rejects with AbortError, even if the
 *   handler is still pending. Without this, race-condition tests prove nothing.
 */
export function mockFetch(handlers: Record<string, MockHandler>) {
  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    const key = `${init?.method ?? 'GET'} ${url.pathname}${url.search}`
    const handler = handlers[key]
    if (!handler) {
      return Promise.reject(new Error(`Unhandled request in test: ${key}`))
    }

    const signal = init?.signal
    return new Promise<Response>((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortError())
        return
      }
      signal?.addEventListener(
        'abort',
        () => {
          reject(abortError())
        },
        { once: true },
      )
      Promise.resolve(handler({ url, init })).then(resolve, reject)
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
