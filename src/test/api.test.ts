import { describe, expect, it, vi } from 'vitest'
import { HttpError, isAbortError } from '../api/client'
import { ParseError } from '../api/parse'
import { createPost, getPostsByUser } from '../api/posts'
import { getUsers } from '../api/users'

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

  it('identifies aborted requests so they are not shown as errors', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true)
    expect(isAbortError(new TypeError('Failed to fetch'))).toBe(false)
  })
})
