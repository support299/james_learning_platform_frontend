import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './Icons.jsx'

export const inputClass =
  'w-full border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-orange-600'
export const monoLabel =
  'font-mono text-[11px] font-medium tracking-[0.15em] text-stone-500 uppercase'
export const blackButton =
  'bg-stone-950 px-6 py-3 font-mono text-xs font-semibold tracking-[0.15em] text-white uppercase hover:bg-stone-800 disabled:cursor-default disabled:opacity-40'
export const outlineButton =
  'border border-stone-300 bg-white px-6 py-3 font-mono text-xs font-semibold tracking-[0.15em] text-stone-800 uppercase hover:bg-stone-100'

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Field({ label, children }) {
  return (
    <div>
      <span className={`${monoLabel} mb-1.5 block`}>{label}</span>
      {children}
    </div>
  )
}

export function PreviewHeading({ children }) {
  return <h3 className={`${monoLabel} mb-3`}>{children}</h3>
}

export function Modal({ title, onClose, children, size = 'md' }) {
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 sm:p-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${sizeClass[size] || sizeClass.md} border border-stone-200 bg-white p-6 shadow-xl sm:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="text-2xl font-extrabold tracking-tight text-stone-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center border border-stone-200 text-stone-600 hover:bg-stone-100"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onClose,
}) {
  const close = () => {
    if (!busy) onClose?.()
  }

  return (
    <Modal title={title} onClose={close} size="sm">
      <p className="text-sm leading-relaxed text-stone-600">{message}</p>
      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          className={outlineButton}
          onClick={close}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={blackButton}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function PromptModal({
  title,
  message,
  label = 'Value',
  placeholder,
  defaultValue = '',
  confirmLabel = 'Continue',
  error,
  onSubmit,
  onClose,
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <Modal title={title} onClose={onClose} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(value)
        }}
      >
        {message && (
          <p className="mb-4 text-sm leading-relaxed text-stone-600">{message}</p>
        )}
        <Field label={label}>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
            placeholder={placeholder}
          />
        </Field>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className={outlineButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={blackButton}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
