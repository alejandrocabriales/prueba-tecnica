import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import { apiUsers, postsOf } from './fixtures'
import { createDeferred, jsonResponse, type MockHandler, mockFetch } from './mockFetch'

const usersRoute = { 'GET /users': () => jsonResponse(apiUsers) }

async function renderAndSelect(userName: RegExp) {
  const user = userEvent.setup()
  render(<App />)
  await user.click(await screen.findByRole('button', { name: userName }))
  return user
}

describe('User posts', () => {
  it('shows the user header and their posts after a loading state', async () => {
    const leannePosts = createDeferred<Response>()
    mockFetch({ ...usersRoute, 'GET /posts?userId=1': () => leannePosts.promise })

    await renderAndSelect(/Leanne Graham/)

    expect(screen.getByRole('status', { name: 'Loading posts' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Leanne Graham' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sincere@april.biz' })).toHaveAttribute(
      'href',
      'mailto:Sincere@april.biz',
    )
    expect(screen.getByText('Romaguera-Crona')).toBeInTheDocument()

    leannePosts.resolve(jsonResponse(postsOf(1)))

    const posts = await screen.findByRole('list', { name: 'Posts' })
    expect(within(posts).getAllByRole('article')).toHaveLength(2)
    expect(within(posts).getByRole('heading', { name: 'Leanne first post' })).toBeInTheDocument()
    expect(screen.getByText('2 posts')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading posts' })).not.toBeInTheDocument()
  })

  it('ignores a slow response from a previously selected user (race condition)', async () => {
    const slowLeanne = createDeferred<Response>()
    let leanneSignal: AbortSignal | null | undefined
    mockFetch({
      ...usersRoute,
      'GET /posts?userId=1': ({ init }) => {
        leanneSignal = init?.signal
        return slowLeanne.promise
      },
      'GET /posts?userId=2': () => jsonResponse(postsOf(2)),
    })

    const user = await renderAndSelect(/Leanne Graham/)
    await user.click(screen.getByRole('button', { name: /Ervin Howell/ }))

    expect(await screen.findByRole('heading', { name: 'Ervin only post' })).toBeInTheDocument()
    expect(leanneSignal?.aborted).toBe(true)

    // The old response arrives late: it must not replace Ervin's posts.
    await act(async () => {
      slowLeanne.resolve(jsonResponse(postsOf(1)))
      await Promise.resolve()
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Ervin Howell' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Leanne first post' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error when posts fail to load and recovers after "Try again"', async () => {
    const postsHandler = vi
      .fn<MockHandler>()
      .mockImplementationOnce(() => jsonResponse({}, 503))
      .mockImplementation(() => jsonResponse(postsOf(1)))
    mockFetch({ ...usersRoute, 'GET /posts?userId=1': postsHandler })

    const user = await renderAndSelect(/Leanne Graham/)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load posts")

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Leanne first post' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an empty state for a user without posts', async () => {
    mockFetch({ ...usersRoute, 'GET /posts?userId=3': () => jsonResponse(postsOf(3)) })

    await renderAndSelect(/Clementine Bauch/)

    expect(await screen.findByText('No posts yet')).toBeInTheDocument()
    expect(screen.getByText("Clementine Bauch hasn't published anything yet.")).toBeInTheDocument()
    expect(screen.getByText('0 posts')).toBeInTheDocument()
  })

  it('keeps the detail open when a search hides the selected user', async () => {
    mockFetch({ ...usersRoute, 'GET /posts?userId=1': () => jsonResponse(postsOf(1)) })

    const user = await renderAndSelect(/Leanne Graham/)
    await user.type(screen.getByRole('searchbox', { name: 'Search users by name' }), 'ervin')

    expect(screen.queryByRole('button', { name: /Leanne Graham/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Leanne Graham' })).toBeInTheDocument()
  })
})
