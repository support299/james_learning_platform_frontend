import { categories } from '../data/courses.js'
import { CloseIcon } from './Icons.jsx'

export const inputClass =
  'w-full border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-orange-600'
export const monoLabel =
  'font-mono text-[11px] font-medium tracking-[0.15em] text-stone-500 uppercase'
export const blackButton =
  'bg-stone-950 px-6 py-3 font-mono text-xs font-semibold tracking-[0.15em] text-white uppercase hover:bg-stone-800 disabled:cursor-default disabled:opacity-40'

export const courseCategories = categories.filter((c) => c !== 'All')

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

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/40 p-4 sm:p-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl border border-stone-200 bg-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center border border-stone-200 text-stone-600 hover:bg-stone-100"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
