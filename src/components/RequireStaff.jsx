import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsStaff, selectStaffKnown } from '../store/authSlice.js'

// Gate for the admin area. Sits inside RequireAuth, so the visitor is already
// signed in — this only asks whether they're staff. While the answer is still
// unknown (the /me refresh hasn't landed yet) it holds rather than redirects,
// so a staff user isn't bounced to the catalog on a hard refresh.
export default function RequireStaff() {
  const isStaff = useSelector(selectIsStaff)
  const known = useSelector(selectStaffKnown)

  if (!known) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f6f5f2]">
        <p className="text-sm text-stone-500">Checking access…</p>
      </div>
    )
  }
  if (!isStaff) return <Navigate to="/" replace />
  return <Outlet />
}
