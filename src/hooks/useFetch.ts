import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { isAbortError } from '../api/client'
import type { AsyncState } from '../types/async'
import { toUserMessage } from '../utils/toUserMessage'

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>

/**
 * What to fetch. `key` identifies the request ("users", "posts:3"):
 * a new key means a new request. `fetch` can be an inline function.
 */
export interface FetchRequest<T> {
  key: string
  fetch: Fetcher<T>
}

type SettledState<T> = Extract<AsyncState<T>, { status: 'success' | 'error' }>

/** A settled result remembers which request produced it. */
interface SettledResult<T> {
  key: string
  attempt: number
  state: SettledState<T>
}

/**
 * Fetches `request` and re-fetches only when `request.key` changes (or on retry).
 *
 * - The effect depends on the key (a string), not on the function identity,
 *   so an inline `fetch` can never trigger a request loop. The latest `fetch`
 *   is read through useEffectEvent.
 * - `loading` is derived, not stored: if the last settled result does not
 *   belong to the current key/attempt, we are loading. No synchronous setState
 *   in the effect (react-hooks/set-state-in-effect), and stale responses for
 *   another key are never shown.
 * - Changing key or unmounting aborts the in-flight request.
 *
 * Passing `null` means "nothing to fetch" and yields `idle`.
 */
export function useFetch<T>(request: FetchRequest<T> | null): {
  state: AsyncState<T>
  retry: () => void
} {
  const key = request?.key ?? null
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<SettledResult<T> | null>(null)

  const fetchLatest = useEffectEvent((signal: AbortSignal) => request?.fetch(signal))

  useEffect(() => {
    if (key === null) {
      return
    }

    const controller = new AbortController()

    fetchLatest(controller.signal)?.then(
      (data) => {
        setResult({ key, attempt, state: { status: 'success', data } })
      },
      (error: unknown) => {
        if (isAbortError(error)) {
          return
        }
        setResult({ key, attempt, state: { status: 'error', error: toUserMessage(error) } })
      },
    )

    return () => {
      controller.abort()
    }
  }, [key, attempt])

  const retry = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  let state: AsyncState<T>
  if (key === null) {
    state = { status: 'idle' }
  } else if (result?.key === key && result.attempt === attempt) {
    state = result.state
  } else {
    state = { status: 'loading' }
  }

  return { state, retry }
}
