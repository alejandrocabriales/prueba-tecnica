import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import { apiUsers, postsOf } from './fixtures'
import { createDeferred, jsonResponse, type MockHandler, mockFetch } from './mockFetch'

/** Mimics JSONPlaceholder: echoes the post back and ALWAYS answers id 101. */
const echoWithId101: MockHandler = ({ init }) => {
  const sent: unknown = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
  return jsonResponse(Object.assign({}, sent, { id: 101 }), 201)
}

const readRoutes = {
  'GET /users': () => jsonResponse(apiUsers),
  'GET /posts?userId=1': () => jsonResponse(postsOf(1)),
  'GET /posts?userId=2': () => jsonResponse(postsOf(2)),
}

async function openLeanneDialog() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(await screen.findByRole('button', { name: /Leanne Graham/ }))
  await screen.findByRole('list', { name: 'Posts' })
  await user.click(screen.getByRole('button', { name: 'New post' }))
  const dialog = screen.getByRole('dialog', { name: 'New post' })
  return {
    user,
    dialog,
    title: within(dialog).getByRole('textbox', { name: /Title/ }),
    body: within(dialog).getByRole('textbox', { name: /Body/ }),
    publish: within(dialog).getByRole('button', { name: 'Publish post' }),
  }
}

function postRequests(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
}

function renderedPostTitles() {
  return within(screen.getByRole('list', { name: 'Posts' }))
    .getAllByRole('heading')
    .map((heading) => heading.textContent)
}

describe('Create post', () => {
  it('rejects empty and whitespace-only fields without sending a request', async () => {
    const fetchMock = mockFetch({ ...readRoutes, 'POST /posts': echoWithId101 })
    const { user, dialog, title, body, publish } = await openLeanneDialog()

    await user.click(publish)

    expect(within(dialog).getByText('Title is required.')).toBeInTheDocument()
    expect(within(dialog).getByText('Body is required.')).toBeInTheDocument()
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Title is required.')
    expect(title).toHaveFocus()

    await user.type(title, '   ')
    await user.type(body, '   ')
    await user.click(publish)

    expect(within(dialog).getByText('Title is required.')).toBeInTheDocument()
    expect(within(dialog).getByText('Body is required.')).toBeInTheDocument()
    expect(postRequests(fetchMock)).toHaveLength(0)

    // Typing clears only that field's error.
    await user.type(title, 'Hello')
    expect(within(dialog).queryByText('Title is required.')).not.toBeInTheDocument()
    expect(title).toHaveAttribute('aria-invalid', 'false')
    expect(within(dialog).getByText('Body is required.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(postRequests(fetchMock)).toHaveLength(0)
  })

  it('disables the form while publishing and shows the new post first with feedback', async () => {
    const pendingPost = createDeferred<Response>()
    mockFetch({ ...readRoutes, 'POST /posts': () => pendingPost.promise })
    const { user, dialog, title, body, publish } = await openLeanneDialog()

    await user.type(title, '  Spring notes  ')
    await user.type(body, 'What changed this week')
    await user.click(publish)

    expect(within(dialog).getByRole('button', { name: 'Publishing…' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()

    pendingPost.resolve(
      jsonResponse({ id: 101, userId: 1, title: 'Spring notes', body: 'What changed this week' }, 201),
    )

    expect(await screen.findByText('Post published')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(renderedPostTitles()[0]).toBe('Spring notes')
    expect(screen.getByText('3 posts')).toBeInTheDocument()
  })

  it('keeps several posts with the same API id and preserves them across user changes', async () => {
    const consoleError = vi.spyOn(console, 'error')
    const fetchMock = mockFetch({ ...readRoutes, 'POST /posts': echoWithId101 })
    const { user, title, body, publish } = await openLeanneDialog()

    await user.type(title, 'First new post')
    await user.type(body, 'First body')
    await user.click(publish)
    await screen.findByText('Post published')

    await user.click(screen.getByRole('button', { name: 'New post' }))
    const secondDialog = screen.getByRole('dialog', { name: 'New post' })
    await user.type(within(secondDialog).getByRole('textbox', { name: /Title/ }), 'Second new post')
    await user.type(within(secondDialog).getByRole('textbox', { name: /Body/ }), 'Second body')
    await user.click(within(secondDialog).getByRole('button', { name: 'Publish post' }))
    await screen.findByRole('heading', { name: 'Second new post' })

    expect(postRequests(fetchMock)).toHaveLength(2)
    expect(renderedPostTitles()).toEqual([
      'Second new post',
      'First new post',
      'Leanne first post',
      'Leanne second post',
    ])

    // Go to another user and come back: created posts are still there.
    await user.click(screen.getByRole('button', { name: /Ervin Howell/ }))
    await screen.findByRole('heading', { name: 'Ervin only post' })
    expect(screen.queryByRole('heading', { name: 'First new post' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Leanne Graham/ }))
    await screen.findByRole('heading', { name: 'Leanne first post' })
    expect(renderedPostTitles()).toEqual([
      'Second new post',
      'First new post',
      'Leanne first post',
      'Leanne second post',
    ])

    // Both API responses had id 101: unique client keys mean no React key warning.
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('keeps the typed values and shows an error when publishing fails', async () => {
    mockFetch({ ...readRoutes, 'POST /posts': () => jsonResponse({}, 500) })
    const { user, dialog, title, body, publish } = await openLeanneDialog()

    await user.type(title, 'Will fail')
    await user.type(body, 'Server is down')
    await user.click(publish)

    const alert = await within(dialog).findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't publish your post")
    expect(title).toHaveValue('Will fail')
    expect(body).toHaveValue('Server is down')
    expect(within(dialog).getByRole('button', { name: 'Publish post' })).toBeEnabled()
    expect(screen.queryByRole('heading', { name: 'Will fail' })).not.toBeInTheDocument()
  })
})
