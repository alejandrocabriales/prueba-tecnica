import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * jsdom does not implement <dialog>.showModal()/close(). This minimal polyfill
 * only toggles `open` so tests can exercise our behaviour (validation, submit,
 * closing). Native focus trapping/inertness is the browser's job and is not
 * simulated here.
 */
// DOM typings say these methods always exist; in jsdom they may not.
const dialogPrototype: Partial<Pick<HTMLDialogElement, 'showModal' | 'close'>> =
  HTMLDialogElement.prototype
if (typeof dialogPrototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
