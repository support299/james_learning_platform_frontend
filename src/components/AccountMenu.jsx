import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserIcon, DocIcon, CheckCircleIcon } from './Icons.jsx'

// Shared account dropdown — used as a drop-down from SiteHeader (top right,
// every student/admin page) and as a drop-up from OnboardingLayout (bottom
// left of the onboarding module's sidebar, which has no SiteHeader of its
// own). Same menu content either way; `direction` only flips which side of
// the trigger the panel opens toward.
export default function AccountMenu({
  user,
  isAdmin,
  onboardingRole,
  onLogout,
  direction = 'down',
}) {
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

  const panelPosition =
    direction === 'up'
      ? 'bottom-full left-0 mb-2'
      : 'top-full right-0 mt-2'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isAdmin ? 'Account menu (admin)' : 'Account menu'}
        className="flex w-full items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-gray-50"
      >
        <span
          aria-hidden="true"
          // Admins get the brand's ink-and-gold pairing so the account they're
          // signed in as is obvious at a glance.
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            isAdmin
              ? 'bg-[#0b0b0b] text-[#C8992E]'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <UserIcon size={18} />
        </span>
        <span className="hidden truncate text-sm font-semibold text-gray-700 sm:inline">
          {user?.username ?? 'Account'}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-40 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg ${panelPosition}`}
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

          {isAdmin && (
            <div className="mt-1 border-t border-gray-100 pt-1">
              <p className="px-3 pt-1 pb-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                Admin
              </p>
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DocIcon size={16} />
                Courses
              </Link>
              <Link
                to="/admin/students"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <UserIcon size={16} />
                Students
              </Link>
              {/* onboardingRole is non-null for assistant/recruiter/leadership
                  — and for superusers too, who auto-count as assistant (see
                  onboarding/permissions.py onboarding_role()). Staff with no
                  onboarding group at all get no link here, matching
                  RequireOnboarding's own gate. */}
              {onboardingRole && (
                <Link
                  to="/onboarding"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircleIcon size={16} />
                  Onboarding
                </Link>
              )}
            </div>
          )}

          {/* An admin's logo now points at /admin, so this is their way back
              to the student-facing catalog. */}
          {isAdmin && (
            <Link
              to="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <DocIcon size={16} />
              Course catalog
            </Link>
          )}

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
