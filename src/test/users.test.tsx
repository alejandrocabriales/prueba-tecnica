import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import { apiUsers } from './fixtures'
import { jsonResponse, type MockHandler, mockFetch } from './mockFetch'

function getUserButtons() {
  return within(screen.getByRole('list', { name: 'Users' })).getAllByRole('button')
}

describe('Users directory', () => {
  it('loads users and filters them by name ignoring case, spaces and accents', async () => {
    mockFetch({ 'GET /users': () => jsonResponse(apiUsers) })
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('status', { name: 'Loading users' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Leanne Graham/ })).toBeInTheDocument()
    expect(getUserButtons()).toHaveLength(4)

    const search = screen.getByRole('searchbox', { name: 'Search users by name' })
    await user.type(search, '  JOSE ')

    expect(getUserButtons()).toHaveLength(1)
    expect(screen.getByRole('button', { name: /José Pérez/ })).toBeInTheDocument()
  })

  it('shows an empty state for searches without results and lets the user clear it', async () => {
    mockFetch({ 'GET /users': () => jsonResponse(apiUsers) })
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('button', { name: /Leanne Graham/ })

    const search = screen.getByRole('searchbox', { name: 'Search users by name' })
    await user.type(search, 'zeta')

    expect(screen.getByText('No users match "zeta"')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Users' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(search).toHaveValue('')
    expect(getUserButtons()).toHaveLength(4)
  })

  it('marks the selected user as current', async () => {
    mockFetch({ 'GET /users': () => jsonResponse(apiUsers) })
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Ervin Howell/ }))

    expect(screen.getByRole('button', { name: /Ervin Howell/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: /Leanne Graham/ })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows an error when users fail to load and recovers after "Try again"', async () => {
    const usersHandler = vi
      .fn<MockHandler>()
      .mockImplementationOnce(() => jsonResponse({}, 500))
      .mockImplementation(() => jsonResponse(apiUsers))
    mockFetch({ 'GET /users': usersHandler })
    const user = userEvent.setup()
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load users")
    expect(alert).toHaveTextContent('The server responded with an error (500)')

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('button', { name: /Leanne Graham/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(usersHandler).toHaveBeenCalledTimes(2)
  })
})
