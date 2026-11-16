/** Stable DOM ids used to move focus between the list and the detail view. */
export const USER_DETAIL_HEADING_ID = 'user-detail-name'

export function userButtonId(userId: number): string {
  return `user-${String(userId)}`
}
