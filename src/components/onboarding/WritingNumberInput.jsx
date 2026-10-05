import { useEffect, useState } from 'react'
import { inputClass } from '../adminUi.jsx'

export default function WritingNumberInput({ value, disabled, onSave }) {
  const [draft, setDraft] = useState(value ?? '')

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  return (
    <input
      type="number"
      min="0"
      step="1"
      inputMode="numeric"
      disabled={disabled}
      value={draft}
      aria-label="Writing number"
      className={inputClass}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const trimmed = String(draft).trim()
        if (trimmed === '') {
          if (value != null) onSave(null)
          return
        }
        if (!/^\d+$/.test(trimmed)) {
          setDraft(value ?? '')
          return
        }
        const next = Number(trimmed)
        if (next === value) return
        onSave(next)
      }}
    />
  )
}
