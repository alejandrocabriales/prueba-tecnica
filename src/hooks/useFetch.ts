import { useCallback, useEffect, useState } from 'react'
import { isAbortError } from '../api/client'
import type { AsyncState } from '../types/async'
import { toUserMessage } from '../utils/toUserMessage'

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>

type SettledState<T> = Extract<AsyncState<T>, { status: 'success' | 'error' }>

/** A settled result remembers which request produced it. */
interface SettledResult<T> {
  fetcher: Fetcher<T>
  attempt: number
  state: SettledState<T>
}

/**
 * Runs `fetcher` whenever its identity changes (pass a stable/memoized function).
 *
 * `loading` is derived, not stored: if the last settled result does not belong
 * to the current request, we are loading. This avoids a synchronous setState
 * inside the effect (react-hooks/set-state-in-effect) and ignores stale
 * responses even if one slipped past the abort.
 *
 * Passing `null` means "nothing to fetch" and yields `idle`.
 */
export function useFetch<T>(fetcher: Fetcher<T> | null): {
  state: AsyncState<T>
  retry: () => void
} {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<SettledResult<T> | null>(null)

  useEffect(() => {
    if (fetcher === null) {
      return
    }

    const controller = new AbortController()

    fetcher(controller.signal).then(
      (data) => {
        setResult({ fetcher, attempt, state: { status: 'success', data } })
      },
      (error: unknown) => {
        if (isAbortError(error)) {
          return
        }
        setResult({ fetcher, attempt, state: { status: 'error', error: toUserMessage(error) } })
      },
    )

    return () => {
      controller.abort()
    }
  }, [fetcher, attempt])

  const retry = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  let state: AsyncState<T>
  if (fetcher === null) {
    state = { status: 'idle' }
  } else if (result?.fetcher === fetcher && result.attempt === attempt) {
    state = result.state
  } else {
    state = { status: 'loading' }
  }

  return { state, retry }
}
