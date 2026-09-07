import { useEffect, useState } from 'react'
import { useSearchGhlUsersQuery } from '../store/ghlApi.js'
import { inputClass } from './adminUi.jsx'
import { CloseIcon, SearchIcon } from './Icons.jsx'

const MAX_SUGGESTIONS = 8

/**
 * Type-ahead over GoHighLevel users already synced into our DB.
 *
 * Single: `value` is one user ({id, name, email, role}) or null.
 * Multiple: `value` is an array of those; picking adds, the chip X removes.
 */
export default function GhlUserPicker({
  value,
  onChange,
  autoFocus = false,
  multiple = false,
  placeholder = 'Start typing a name…',
}) {
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = multiple ? value ?? [] : value ? [value] : []
  const selectedIds = new Set(selected.map((u) => u.id))

  useEffect(() => {
    const id = setTimeout(() => setTerm(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  const { data = [], isFetching, error } = useSearchGhlUsersQuery(term, {
    skip: !open || (!multiple && value != null),
  })
  const suggestions = data
    .filter((u) => !selectedIds.has(u.id))
    .slice(0, MAX_SUGGESTIONS)
  const notConnected = error?.status === 404

  const choose = (user) => {
    if (multiple) {
      onChange([...selected, user])
      setQuery('')
      setActive(0)
      return
    }
    onChange(user)
    setQuery('')
    setOpen(false)
  }

  const remove = (id) => {
    if (multiple) {
      onChange(selected.filter((u) => u.id !== id))
    } else {
      onChange(null)
    }
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
      e.preventDefault()
      choose(suggestions[active])
    }
  }

  if (!multiple && value) {
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
    <div className="space-y-2">
      {multiple && selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((user) => (
            <li
              key={user.id}
              className="flex max-w-full items-center gap-2 border border-stone-300 bg-white py-1 pr-1 pl-2.5"
            >
              <span className="min-w-0 truncate text-sm text-stone-900">
                {user.name || user.email || user.id}
              </span>
              <button
                type="button"
                onClick={() => remove(user.id)}
                aria-label={`Remove ${user.name || user.email || user.id}`}
                className="shrink-0 p-1 text-stone-500 hover:text-stone-900"
              >
                <CloseIcon size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
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
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
            placeholder={placeholder}
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
                Couldn’t load synced users.
              </p>
            ) : isFetching && !suggestions.length ? (
              <p className="px-3.5 py-3 text-sm text-stone-500">Searching…</p>
            ) : !suggestions.length ? (
              <p className="px-3.5 py-3 text-sm text-stone-500">
                {term
                  ? `No synced users match “${term}”.`
                  : 'No synced users yet.'}
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
                  {[user.email, user.role, user.locationId]
                    .filter(Boolean)
                    .join(' · ') || user.id}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
