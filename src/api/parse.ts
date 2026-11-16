/**
 * Minimal runtime validation for API payloads.
 * Responses are `unknown` at the network boundary and narrowed here,
 * so a contract change fails loudly instead of breaking the UI later.
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number') {
    throw new ParseError(`Expected "${key}" to be a number`)
  }
  return value
}

export function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new ParseError(`Expected "${key}" to be a string`)
  }
  return value
}

export function parseArray<T>(data: unknown, parseItem: (item: unknown) => T): T[] {
  if (!Array.isArray(data)) {
    throw new ParseError('Expected an array')
  }
  return data.map(parseItem)
}
