/** Must match the breakpoint used in App.module.css. */
export const SMALL_SCREEN_QUERY = '(max-width: 767px)'

/** Environments without matchMedia (e.g. jsdom) are treated as desktop. */
export function isSmallScreen(): boolean {
  // DOM typings say matchMedia always exists; jsdom declares it but leaves it unimplemented.
  const { matchMedia }: Partial<Pick<Window, 'matchMedia'>> = window
  if (typeof matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(SMALL_SCREEN_QUERY).matches
}
