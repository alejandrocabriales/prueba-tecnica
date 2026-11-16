import { useId, useRef } from 'react'
import styles from './SearchInput.module.css'

interface SearchInputProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ label, placeholder, value, onChange }: SearchInputProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className="visually-hidden">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value)
        }}
      />
      {value !== '' && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={handleClear}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
