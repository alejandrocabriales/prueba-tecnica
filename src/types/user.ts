/** Subset of the JSONPlaceholder user that the UI actually uses. */
export interface User {
  id: number
  name: string
  username: string
  email: string
  /** Flattened from `company.name`: the UI only shows the name. */
  companyName: string
}
