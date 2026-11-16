import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFetch } from '../hooks/useFetch'

describe('useFetch', () => {
  it('does not refetch on re-render when the fetcher is an inline function', async () => {
    const load = vi.fn<(signal: AbortSignal) => Promise<string>>(() => Promise.resolve('data'))

    const { result, rerender } = renderHook(() =>
      // A new object and a new function on every render, on purpose.
      useFetch({ key: 'same-key', fetch: (signal) => load(signal) }),
    )

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', data: 'data' })
    })
    rerender()
    rerender()

    expect(load).toHaveBeenCalledTimes(1)
    expect(result.current.state).toEqual({ status: 'success', data: 'data' })
  })

  it('refetches when the key changes and on retry', async () => {
    const load = vi.fn<(signal: AbortSignal) => Promise<string>>(() => Promise.resolve('data'))

    const { result, rerender } = renderHook(({ key }) => useFetch({ key, fetch: load }), {
      initialProps: { key: 'a' },
    })
    await waitFor(() => {
      expect(result.current.state.status).toBe('success')
    })

    rerender({ key: 'b' })
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => {
      expect(result.current.state.status).toBe('success')
    })

    act(() => {
      result.current.retry()
    })
    await waitFor(() => {
      expect(load).toHaveBeenCalledTimes(3)
    })
  })

  it('stays idle and does not fetch without a request', () => {
    const { result } = renderHook(() => useFetch<string>(null))

    expect(result.current.state).toEqual({ status: 'idle' })
  })
})
