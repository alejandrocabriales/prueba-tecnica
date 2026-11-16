import { vi } from 'vitest'

export type MockHandler = (request: { url: URL; init?: RequestInit }) => Response | Promise<Response>

/** Builds a JSON Response. Create a new one per call: a body can only be read once. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Replaces global fetch with a router keyed by "METHOD /path?query".
 * Unknown routes reject loudly so a test never hits the real network.
 */
export function mockFetch(handlers: Record<string, MockHandler>) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    const key = `${init?.method ?? 'GET'} ${url.pathname}${url.search}`
    const handler = handlers[key]
    if (!handler) {
      throw new Error(`Unhandled request in test: ${key}`)
    }
    return handler({ url, init })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
