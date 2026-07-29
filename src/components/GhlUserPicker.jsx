import { useEffect, useState } from 'react'
import { useSearchGhlUsersQuery } from '../store/ghlApi.js'
import { inputClass } from './adminUi.jsx'
import { CloseIcon, SearchIcon } from './Icons.jsx'

const MAX_SUGGESTIONS = 8

/**
 * Type-ahead over the connected sub-account's GoHighLevel users.
 *
 * `value` is the chosen user ({id, name, email, role}) or null, and `onChange`
 * gets the same. The id is only ever set by picking a suggestion — an admin
 * typing a name shouldn't have half a name submitted as an id.
 */
export default function GhlUserPicker({ value, onChange, autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  // Debounce so typing doesn't fire a GHL request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setTerm(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  // Nothing is fetched until the field is actually in use.
  const { data = [], isFetching, error } = useSearchGhlUsersQuery(term, {
    skip: !open || value != null,
  })
  const suggestions = data.slice(0, MAX_SUGGESTIONS)
  const notConnected = error?.status === 404

  const choose = (user) => {
    onChange(user)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') return setOpen(false)
    if (!open && e.key === 'ArrowDown') return setOpen(true)
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      // The picker lives inside a form; Enter picks a user, it doesn't submit.
      e.preventDefault()
      choose(suggestions[active])
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 border border-stone-300 bg-white px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-900">
            {value.name || value.email || value.id}
          </p>
          <p className="truncate font-mono text-[11px] text-stone-500">
            {value.id}
            {value.email ? ` · ${value.email}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove the linked GoHighLevel user"
          className="shrink-0 border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-100"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 border border-stone-300 bg-white px-3.5 text-stone-400 focus-within:border-orange-600">
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          // Opens on a click or a keystroke rather than on focus: the field is
          // focused when the form opens, and that shouldn't call GHL on its own.
          onClick={() => setOpen(true)}
          // Suggestions use onMouseDown, so they land before this closes.
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder="Start typing a name…"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className={`${inputClass} border-0 px-0 focus:border-0`}
        />
      </div>

      {open && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto border border-stone-300 bg-white shadow-lg">
          {notConnected ? (
            <p className="px-3.5 py-3 text-sm text-stone-500">
              GoHighLevel isn’t connected yet.
            </p>
          ) : error ? (
            <p className="px-3.5 py-3 text-sm text-red-600">
              Couldn’t reach GoHighLevel.
            </p>
          ) : isFetching && !suggestions.length ? (
            <p className="px-3.5 py-3 text-sm text-stone-500">Searching…</p>
          ) : !suggestions.length ? (
            <p className="px-3.5 py-3 text-sm text-stone-500">
              No GoHighLevel users match “{term}”.
            </p>
          ) : (
            suggestions.map((user, i) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(user)}
                className={`block w-full px-3.5 py-2.5 text-left ${
                  i === active ? 'bg-stone-100' : 'hover:bg-stone-50'
                }`}
              >
                <span className="block truncate text-sm text-stone-900">
                  {user.name || user.email || user.id}
                </span>
                <span className="mt-0.5 block truncate text-xs text-stone-500">
                  {[user.email, user.role].filter(Boolean).join(' · ') ||
                    user.id}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
