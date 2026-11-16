import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import { apiUsers, postsOf } from './fixtures'
import { jsonResponse, mockFetch } from './mockFetch'

function mockRoutes() {
  mockFetch({
    'GET /users': () => jsonResponse(apiUsers),
    'GET /posts?userId=1': () => jsonResponse(postsOf(1)),
    'GET /posts?userId=2': () => jsonResponse(postsOf(2)),
  })
}

function setScreen(size: 'small' | 'large') {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: size === 'small', media: query })),
  )
}

describe('Navigation and focus', () => {
  it('on small screens moves focus to the detail and back to the selected user', async () => {
    setScreen('small')
    mockRoutes()
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Leanne Graham/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Leanne Graham' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: /Back to users/ }))
    expect(screen.getByRole('button', { name: /Leanne Graham/ })).toHaveFocus()
  })

  it('on large screens keeps focus in the list so the user can keep browsing', async () => {
    setScreen('large')
    mockRoutes()
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Leanne Graham/ }))

    expect(screen.getByRole('button', { name: /Leanne Graham/ })).toHaveFocus()
    expect(screen.getByRole('heading', { level: 2, name: 'Leanne Graham' })).not.toHaveFocus()
  })

  it('names the browser tab after the selected user', async () => {
    mockRoutes()
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('button', { name: /Leanne Graham/ })
    expect(document.title).toBe('Directory')

    await user.click(screen.getByRole('button', { name: /Ervin Howell/ }))
    expect(document.title).toBe('Ervin Howell · Directory')
  })
})
