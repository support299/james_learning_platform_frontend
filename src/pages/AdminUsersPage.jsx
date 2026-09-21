import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../store/authSlice.js'
import {
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  usePromoteToStaffMutation,
  useDemoteFromStaffMutation,
} from '../store/adminUsersApi.js'
import { useGetStudentsQuery } from '../store/studentsApi.js'
import { errorMessage, formatDate, slugify } from '../utils/adminHelpers.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { SearchIcon, TrashIcon, ArrowIcon } from '../components/Icons.jsx'
import {
  ConfirmModal,
  Modal,
  Field,
  inputClass,
  monoLabel,
  blackButton,
  outlineButton,
} from '../components/adminUi.jsx'

const rowButton =
  'px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950 disabled:opacity-40'

function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

function CreateAdminForm({ onDone }) {
  const [createAdminUser, { isLoading }] = useCreateAdminUserMutation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [error, setError] = useState(null)

  const effectiveUsername = usernameTouched
    ? username
    : slugify(`${firstName} ${lastName}`)
  const canSubmit =
    effectiveUsername.trim() !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    !isLoading

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await createAdminUser({
        username: effectiveUsername.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        isSuperuser,
      }).unwrap()
      onDone?.()
    } catch (err) {
      setError(errorMessage(err, 'Could not create the account.'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First Name">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Last Name">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Username">
          <input
            type="text"
            value={effectiveUsername}
            onChange={(e) => {
              setUsernameTouched(true)
              setUsername(e.target.value)
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Temporary Password">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>
      <label className="flex items-center gap-2.5 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={isSuperuser}
          onChange={(e) => setIsSuperuser(e.target.checked)}
          className="size-4 accent-stone-900"
        />
        Superadmin (can manage other admins; also full onboarding access)
      </label>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={!canSubmit} className={blackButton}>
        {isLoading ? 'Creating…' : '+ Create Admin'}
      </button>
    </form>
  )
}

function PromoteExisting({ onDone }) {
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const { data: candidates = [], isFetching } = useGetStudentsQuery(search)
  const [promoteToStaff, { isLoading }] = usePromoteToStaffMutation()
  const [error, setError] = useState(null)

  const promote = async (id) => {
    setError(null)
    try {
      await promoteToStaff(id).unwrap()
      onDone?.()
    } catch (err) {
      setError(errorMessage(err, 'Could not promote that account.'))
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2.5 border border-stone-300 bg-white px-3.5 py-2.5 text-stone-400 focus-within:border-orange-600">
        <SearchIcon />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search existing accounts by name or email..."
          className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
        />
      </label>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <ul className="max-h-72 divide-y divide-stone-200 overflow-y-auto border border-stone-200">
        {candidates.slice(0, 20).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-stone-900">
                {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.username}
              </span>
              <span className="block truncate text-xs text-stone-500">{c.email}</span>
            </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => promote(c.id)}
              className={outlineButton}
            >
              Make staff
            </button>
          </li>
        ))}
        {candidates.length === 0 && (
          <li className="px-3.5 py-6 text-center text-sm text-stone-500">
            {isFetching ? 'Searching…' : 'No matching accounts.'}
          </li>
        )}
      </ul>
    </div>
  )
}

function AddAdminModal({ onClose }) {
  const [mode, setMode] = useState('promote')
  const tab = (id, label) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      className={`px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.1em] uppercase ${
        mode === id ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      {label}
    </button>
  )
  return (
    <Modal title="Add Admin" size="lg" onClose={onClose}>
      <div className="mb-5 flex gap-1">
        {tab('promote', 'Promote existing')}
        {tab('create', 'Create new')}
      </div>
      {mode === 'promote' ? (
        <PromoteExisting onDone={onClose} />
      ) : (
        <CreateAdminForm onDone={onClose} />
      )}
    </Modal>
  )
}

function AdminRow({ admin, isSelf }) {
  const [updateAdminUser, { isLoading: isSaving }] = useUpdateAdminUserMutation()
  const [deleteAdminUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation()
  const [demoteFromStaff, { isLoading: isDemoting }] = useDemoteFromStaffMutation()
  const [confirming, setConfirming] = useState(null)
  const [error, setError] = useState(null)

  const run = async (action) => {
    setError(null)
    try {
      await action().unwrap()
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong.'))
    }
    setConfirming(null)
  }

  const busy = isSaving || isDeleting || isDemoting
  const name = [admin.firstName, admin.lastName].filter(Boolean).join(' ')

  return (
    <>
      <tr className="border-t border-stone-200">
        <td className="px-4 py-3.5">
          <span className="block font-semibold text-stone-900">
            {name || admin.username}
            {isSelf && <span className="ml-2 text-xs font-normal text-stone-500">(you)</span>}
          </span>
          {name && <span className="block text-xs text-stone-500">{admin.username}</span>}
          {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
        </td>
        <td className="px-4 py-3.5 text-stone-700">{admin.email || '—'}</td>
        <td className="px-4 py-3.5">
          <span
            className={`inline-block px-2 py-1 font-mono text-[11px] font-medium tracking-[0.1em] uppercase ${
              admin.isSuperuser ? 'bg-stone-950 text-[#C8992E]' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {admin.isSuperuser ? 'Superadmin' : 'Staff'}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className={monoLabel}>{formatDate(admin.lastLogin)}</span>
        </td>
        <td className="px-4 py-3.5">
          <span
            className={`inline-block px-2 py-1 font-mono text-[11px] font-medium tracking-[0.1em] uppercase ${
              admin.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {admin.isActive ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td className="px-4 py-3.5">
          {!isSelf && (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => updateAdminUser({ id: admin.id, isSuperuser: !admin.isSuperuser }))}
                className={rowButton}
              >
                {admin.isSuperuser ? 'Make staff' : 'Make superadmin'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => updateAdminUser({ id: admin.id, isActive: !admin.isActive }))}
                className={rowButton}
              >
                {admin.isActive ? 'Disable' : 'Enable'}
              </button>
              {!admin.isSuperuser && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming('demote')}
                  className={rowButton}
                >
                  Remove access
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming('delete')}
                aria-label={`Delete ${admin.username}`}
                className="flex size-8 items-center justify-center text-stone-500 hover:text-red-600 disabled:opacity-40"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          )}
        </td>
      </tr>
      {confirming === 'demote' && (
        <ConfirmModal
          title="Remove admin access"
          confirmLabel="Remove access"
          message={`${admin.username} becomes a regular student account and loses access to the admin area.`}
          busy={isDemoting}
          onConfirm={() => run(() => demoteFromStaff(admin.id))}
          onClose={() => setConfirming(null)}
        />
      )}
      {confirming === 'delete' && (
        <ConfirmModal
          title="Delete admin"
          message={`Delete ${admin.username}? Anything they own in onboarding becomes unassigned. This cannot be undone.`}
          busy={isDeleting}
          onConfirm={() => run(() => deleteAdminUser(admin.id))}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  )
}

export default function AdminUsersPage() {
  const me = useSelector(selectCurrentUser)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const search = useDebounced(query.trim())
  const { data: admins = [], isLoading, isError, refetch } = useGetAdminUsersQuery(search)

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-8 py-10">
        <Link
          to="/admin"
          className={`${monoLabel} inline-flex items-center gap-1.5 hover:text-stone-900`}
        >
          <ArrowIcon size={14} direction="left" /> Back to courses
        </Link>

        <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
              Admin users
            </h1>
            <p className="mt-1.5 text-stone-500">
              Add staff, promote them to superadmin, or remove their access.
            </p>
          </div>
          <button type="button" onClick={() => setShowAdd(true)} className={blackButton}>
            + Add Admin
          </button>
        </div>

        <div className="border-y border-stone-200 py-5">
          <label className="flex items-center gap-2.5 border border-stone-300 bg-white px-3.5 py-2.5 text-stone-400 focus-within:border-orange-600 sm:w-72">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admins..."
              className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>

        <p className={`${monoLabel} mt-5 mb-5`}>
          {admins.length} Admin{admins.length === 1 ? '' : 's'}
          {search ? ' found' : ''}
        </p>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center border border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <p className="text-sm text-stone-500">Loading admins…</p>
          </div>
        ) : isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-red-300 bg-red-50/50 p-10 text-center">
            <p className="text-lg font-bold text-stone-900">Couldn’t load admins</p>
            <button type="button" onClick={() => refetch()} className={`${outlineButton} mt-5`}>
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr>
                  {['User', 'Email', 'Role', 'Last login', 'Status'].map((heading) => (
                    <th key={heading} className={`${monoLabel} px-4 py-3`}>
                      {heading}
                    </th>
                  ))}
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <AdminRow key={admin.id} admin={admin} isSelf={admin.id === me?.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
