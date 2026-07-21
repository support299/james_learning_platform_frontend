import { Link } from 'react-router-dom'
import { SearchIcon, BellIcon, UserIcon } from './Icons.jsx'

export default function SiteHeader({
  showSearch = false,
  searchPlaceholder = 'Search...',
  showNotifications = false,
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-4">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-blue-700">
          AgentGrowth
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
          {showNotifications && (
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
            >
              <BellIcon />
            </button>
          )}
          <span
            aria-label="Profile"
            className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
          >
            <UserIcon size={18} />
          </span>
        </div>
      </div>
    </header>
  )
}
