import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout, selectCurrentUser } from '../store/authSlice.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { UserIcon } from '../components/Icons.jsx'

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-0">
      <span className="text-sm font-semibold text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  )
}

export default function ProfilePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const signOut = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <UserIcon size={28} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {user?.username ?? 'Your profile'}
            </h1>
            <p className="text-sm text-gray-500">Account details</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <Row label="Username" value={user?.username} />
          <Row label="Email" value={user?.email} />
        </div>

        <button
          type="button"
          onClick={signOut}
          className="mt-6 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Log out
        </button>
      </main>
    </div>
  )
}
