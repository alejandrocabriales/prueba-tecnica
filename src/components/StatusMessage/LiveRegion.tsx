interface LiveRegionProps {
  message: string
}

/**
 * Always-mounted, visually hidden live region. Screen readers announce
 * changes to the content of a region that already exists; a region created
 * together with its text may be skipped. Errors use role="alert" instead,
 * which is designed to be inserted on demand.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <p role="status" className="visually-hidden">
      {message}
    </p>
  )
}
