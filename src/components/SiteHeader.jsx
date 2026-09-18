import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  logout,
  selectIsAuthenticated,
  selectCurrentUser,
  selectIsStaff,
  selectOnboardingRole,
} from '../store/authSlice.js'
import { SearchIcon, LogoMark } from './Icons.jsx'
import AccountMenu from './AccountMenu.jsx'

export default function SiteHeader({
  showSearch = false,
  searchPlaceholder = 'Search...',
  showAuth = true,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthed = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const isAdmin = useSelector(selectIsStaff)
  const onboardingRole = useSelector(selectOnboardingRole)

  const signOut = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-4">
        <Link
          // Home for an admin is the admin area, which is also where logging
          // in drops them.
          to={isAdmin ? '/admin' : '/'}
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
            <AccountMenu
              user={user}
              isAdmin={isAdmin}
              onboardingRole={onboardingRole}
              onLogout={signOut}
            />
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
