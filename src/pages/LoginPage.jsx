import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useLoginMutation, useLazyGetMeQuery } from '../store/authApi.js'
import {
  setCredentials,
  setUser,
  selectIsAuthenticated,
  selectIsStaff,
} from '../store/authSlice.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { LogoMark } from '../components/Icons.jsx'

// Flatten a DRF error body ({field: [msgs]} or {detail: msg}) into one string.
function errorMessage(err, fallback) {
  const data = err?.data
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  const first = Object.values(data)[0]
  if (Array.isArray(first)) return first[0]
  if (typeof first === 'string') return first
  return fallback
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthed = useSelector(selectIsAuthenticated)
  const isAdmin = useSelector(selectIsStaff)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const [login, { isLoading }] = useLoginMutation()
  const [fetchMe] = useLazyGetMeQuery()

  // Where to land once signed in: whatever page bounced them here, else the
  // home appropriate to the account — the admin area for staff.
  const landing = (admin) => location.state?.from ?? (admin ? '/admin' : '/')
  const canSubmit = email.trim() !== '' && password !== '' && !isLoading

  // Already signed in — no reason to be here. Redirecting declaratively
  // rather than calling navigate() here: that's a side effect during render,
  // which React is free to drop, leaving the `return null` on screen.
  if (isAuthed) {
    return <Navigate to={landing(isAdmin)} replace />
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const tokens = await login({
        email: email.trim(),
        password,
      }).unwrap()
      dispatch(setCredentials(tokens))
      // login returns tokens and is_admin; fetch the rest of the user for the
      // header.
      try {
        const me = await fetchMe().unwrap()
        dispatch(setUser(me))
      } catch {
        // non-fatal — the header just won't show a name until next load
      }
      // Read the flag off the response rather than the store: this closure
      // still sees the pre-login state.
      navigate(landing(tokens.is_admin), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Invalid email or password.'))
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none focus:border-blue-700 focus:bg-white'

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader showAuth={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoMark size={40} className="text-[#0b0b0b]" />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Log in to continue learning.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-[#0b0b0b] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-default disabled:opacity-40"
            >
              {isLoading ? 'Please wait…' : 'Log in'}
            </button>
          </form>

        </div>
      </main>
    </div>
  )
}
