import { NavLink, Outlet, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectOnboardingRole } from '../../store/authSlice.js'
import { LogoMark } from '../Icons.jsx'

const links = [
  { to: '/onboarding', label: 'Dashboard', end: true },
  { to: '/onboarding/agents', label: 'Agents' },
  { to: '/onboarding/cohorts', label: 'Teams' },
  { to: '/onboarding/audit', label: 'Friday audit' },
]

export default function OnboardingLayout() {
  const user = useSelector(selectCurrentUser)
  const role = useSelector(selectOnboardingRole)
  const isAssistant = role === 'assistant'

  return (
    <div className="flex min-h-svh bg-[#f6f5f2]">
      <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-5">
          <Link to="/onboarding" className="flex items-center gap-2.5">
            <LogoMark size={28} className="text-[#0b0b0b]" />
            <span className="text-sm font-extrabold tracking-tight text-stone-900">
              Agent
              <span className="block text-[11px] font-medium tracking-[0.14em] text-stone-500 uppercase">
                Onboarding
              </span>
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-stone-950 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAssistant && (
            <NavLink
              to="/onboarding/settings"
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-stone-950 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`
              }
            >
              Settings
            </NavLink>
          )}
        </nav>
        <div className="border-t border-stone-200 p-4">
          <p className="truncate text-xs text-stone-500">{user?.username}</p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-stone-400 uppercase">
            {role}
          </p>
          <Link
            to="/admin"
            className="mt-3 inline-block text-xs font-medium text-orange-700 hover:text-orange-800"
          >
            ← Academy admin
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
