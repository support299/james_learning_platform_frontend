import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../store/authSlice.js'

// Gate for protected routes: unauthenticated visitors are sent to /login,
// remembering where they were headed so login can bounce them back.
export default function RequireAuth() {
  const isAuthed = useSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    )
  }
  return <Outlet />
}
