import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  selectIsStaff,
  selectOnboardingRole,
  selectStaffKnown,
} from '../store/authSlice.js'

export default function RequireOnboarding() {
  const isStaff = useSelector(selectIsStaff)
  const known = useSelector(selectStaffKnown)
  const role = useSelector(selectOnboardingRole)
  const user = useSelector((state) => state.auth.user)
  const roleKnown = user && 'onboarding_role' in user

  if (!known || (isStaff && !roleKnown)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f6f5f2]">
        <p className="text-sm text-stone-500">Checking access…</p>
      </div>
    )
  }
  if (!isStaff) return <Navigate to="/" replace />
  if (!role) return <Navigate to="/admin" replace />
  return <Outlet />
}
