/** Joins class names, skipping falsy values. Tiny local alternative to `clsx`. */
export function cx(...classNames: (string | false | null | undefined)[]): string {
  return classNames.filter(Boolean).join(' ')
}
