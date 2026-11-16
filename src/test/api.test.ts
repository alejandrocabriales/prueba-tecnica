import { describe, expect, it, vi } from 'vitest'
import { HttpError, isAbortError, NetworkError } from '../api/client'
import { ParseError } from '../api/parse'
import { createPost, getPostsByUser } from '../api/posts'
import { getUsers } from '../api/users'
import { toUserMessage } from '../utils/toUserMessage'

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('api layer', () => {
  it('parses users and drops fields the UI does not use', async () => {
    stubFetch([
      {
        id: 1,
        name: 'Leanne Graham',
        username: 'Bret',
        email: 'a@b.c',
        address: {},
        company: { name: 'Romaguera-Crona', catchPhrase: 'Multi-layered client-server' },
      },
    ])

    await expect(getUsers()).resolves.toEqual([
      { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'a@b.c', companyName: 'Romaguera-Crona' },
    ])
  })

  it('rejects with HttpError on non-2xx responses', async () => {
    stubFetch({}, 404)

    await expect(getPostsByUser(1)).rejects.toSatisfy(
      (error: unknown) => error instanceof HttpError && error.status === 404,
    )
  })

  it('rejects with ParseError when the payload breaks the contract', async () => {
    stubFetch([{ id: '1', name: 'No numeric id' }])

    await expect(getUsers()).rejects.toBeInstanceOf(ParseError)
  })

  it('sends new posts as a JSON POST', async () => {
    const fetchMock = stubFetch({ id: 101, userId: 1, title: 'Hola', body: 'Mundo' }, 201)

    await createPost({ userId: 1, title: 'Hola', body: 'Mundo' })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://jsonplaceholder.typicode.com/posts')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ userId: 1, title: 'Hola', body: 'Mundo' }))
  })

  it('wraps fetch failures in NetworkError but leaves aborts untouched', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(getUsers()).rejects.toBeInstanceOf(NetworkError)

    const abort = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(abort))
    await expect(getUsers()).rejects.toBe(abort)
  })

  it('only blames the connection for real network errors, not for bugs', () => {
    expect(toUserMessage(new NetworkError('/users', { cause: new TypeError('Failed to fetch') }))).toBe(
      'Check your connection and try again.',
    )
    expect(toUserMessage(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('identifies aborted requests so they are not shown as errors', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true)
    expect(isAbortError(new TypeError('Failed to fetch'))).toBe(false)
  })
})
