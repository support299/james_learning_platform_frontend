import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  selectIsSuperadmin,
  selectSuperadminKnown,
} from '../store/authSlice.js'

export default function RequireSuperadmin() {
  const isSuperadmin = useSelector(selectIsSuperadmin)
  const known = useSelector(selectSuperadminKnown)

  if (!known) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f6f5f2]">
        <p className="text-sm text-stone-500">Checking access…</p>
      </div>
    )
  }
  if (!isSuperadmin) return <Navigate to="/admin" replace />
  return <Outlet />
}
