import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  logout,
  selectIsAuthenticated,
  selectCurrentUser,
} from '../store/authSlice.js'
import { SearchIcon, UserIcon, LogoMark } from './Icons.jsx'

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-gray-50"
      >
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
        >
          <UserIcon size={18} />
        </span>
        <span className="hidden text-sm font-semibold text-gray-700 sm:inline">
          {user?.username ?? 'Account'}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.username ?? 'Signed in'}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            )}
          </div>

          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <UserIcon size={16} />
            Profile
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <span className="flex w-4 justify-center" aria-hidden="true">
              ⎋
            </span>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function SiteHeader({
  showSearch = false,
  searchPlaceholder = 'Search...',
  showAuth = true,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthed = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  const signOut = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight"
        >
          <LogoMark size={32} className="text-[#0b0b0b]" />
          <span className="text-gray-900">
            Aftermath <span className="text-[#C8992E]">Academy</span>
          </span>
        </Link>

        {showSearch && (
          <label className="hidden w-full max-w-md items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500 focus-within:border-blue-700 sm:flex">
            <SearchIcon />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-gray-700 outline-none"
            />
          </label>
        )}

        <div className="flex items-center gap-3">
          {!showAuth ? null : isAuthed ? (
            <ProfileMenu user={user} onLogout={signOut} />
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-[#0b0b0b] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
