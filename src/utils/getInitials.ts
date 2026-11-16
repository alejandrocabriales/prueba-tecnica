/** "Mrs. Dennis Schulist" -> "DS" (honorifics ending in "." are skipped). */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word !== '' && !word.endsWith('.'))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
