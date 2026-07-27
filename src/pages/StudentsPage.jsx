import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from '../store/studentsApi.js'
import { formatDate, slugify } from '../utils/adminHelpers.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { SearchIcon, TrashIcon, ArrowIcon } from '../components/Icons.jsx'
import {
  Modal,
  Field,
  inputClass,
  monoLabel,
  blackButton,
  outlineButton,
} from '../components/adminUi.jsx'

// Flatten a DRF error body ({field: [msgs]} or {detail: msg}) into one string.
function errorMessage(err, fallback) {
  const data = err?.data
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  const [field, value] = Object.entries(data)[0] ?? []
  const message = Array.isArray(value) ? value[0] : value
  if (typeof message !== 'string') return fallback
  return field === 'non_field_errors' ? message : `${field}: ${message}`
}

function fullName(student) {
  return [student.firstName, student.lastName].filter(Boolean).join(' ')
}

function AddStudentForm({ onDone }) {
  const [createStudent, { isLoading }] = useCreateStudentMutation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Once the admin edits the username by hand, stop deriving it from the name.
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [error, setError] = useState(null)

  const suggested = slugify(`${firstName} ${lastName}`)
  const effectiveUsername = usernameTouched ? username : suggested

  const canSubmit =
    effectiveUsername.trim() !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    !isLoading

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await createStudent({
        username: effectiveUsername.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      }).unwrap()
      onDone?.()
    } catch (err) {
      setError(errorMessage(err, 'Could not create the student.'))
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
            placeholder="e.g. Alex"
            className={inputClass}
            autoFocus
          />
        </Field>
        <Field label="Last Name">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Rivera"
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
            placeholder="alex-rivera"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-stone-500">
            What the student types to log in.
          </p>
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
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
          placeholder="Share this with the student"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-stone-500">
          Shown in plain text so you can pass it on — the student can change it
          later.
        </p>
      </Field>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button type="submit" disabled={!canSubmit} className={blackButton}>
        {isLoading ? 'Creating…' : '+ Create Student'}
      </button>
    </form>
  )
}

function StudentRow({ student }) {
  const [updateStudent, { isLoading: isSaving }] = useUpdateStudentMutation()
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation()

  const toggleActive = () =>
    updateStudent({ id: student.id, isActive: !student.isActive })

  const remove = () => {
    if (
      window.confirm(
        `Delete ${student.username}? Their course progress is deleted too.`,
      )
    ) {
      deleteStudent(student.id)
    }
  }

  const name = fullName(student)

  return (
    <tr className="border-t border-stone-200">
      <td className="px-4 py-3.5">
        <Link
          to={`/admin/students/${student.id}`}
          className="block font-semibold text-stone-900 hover:text-orange-600"
        >
          {name || student.username}
        </Link>
        {name && (
          <span className="block text-xs text-stone-500">
            {student.username}
          </span>
        )}
      </td>
      <td className="px-4 py-3.5 text-stone-700">{student.email || '—'}</td>
      <td className="px-4 py-3.5">
        <span className={monoLabel}>{formatDate(student.dateJoined)}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className={monoLabel}>{formatDate(student.lastLogin)}</span>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-block px-2 py-1 font-mono text-[11px] font-medium tracking-[0.1em] uppercase ${
            student.isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          {student.isActive ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/admin/students/${student.id}`}
            className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950"
          >
            Courses
          </Link>
          <button
            type="button"
            onClick={toggleActive}
            disabled={isSaving}
            className="px-2 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-stone-600 uppercase hover:text-stone-950 disabled:opacity-40"
          >
            {student.isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isDeleting}
            aria-label={`Delete ${student.username}`}
            className="flex size-8 items-center justify-center text-stone-500 hover:text-red-600 disabled:opacity-40"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function StudentsPage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [showNewStudent, setShowNewStudent] = useState(false)

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  const {
    data: students = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentsQuery(search)

  const forbidden = error?.status === 403 || error?.status === 401

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
              Students
            </h1>
            <p className="mt-1.5 text-stone-500">
              Create accounts and manage who can access the catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewStudent(true)}
            className={blackButton}
          >
            + New Student
          </button>
        </div>

        <div className="flex flex-col gap-4 border-y border-stone-200 py-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex items-center gap-2.5 border border-stone-300 bg-white px-3.5 py-2.5 text-stone-400 focus-within:border-orange-600 sm:w-72">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </label>
        </div>

        <p className={`${monoLabel} mt-5 mb-5`}>
          {students.length} Student{students.length === 1 ? '' : 's'}
          {search ? ' found' : ''}
        </p>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center border border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <p className="text-sm text-stone-500">Loading students…</p>
          </div>
        ) : isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-red-300 bg-red-50/50 p-10 text-center">
            <p className="text-lg font-bold text-stone-900">
              {forbidden ? 'Staff access required' : 'Couldn’t reach the API'}
            </p>
            <p className="mt-1.5 text-sm text-stone-500">
              {forbidden
                ? 'Only staff accounts can manage students.'
                : 'Make sure the Django server is running on port 8000.'}
            </p>
            {!forbidden && (
              <button
                type="button"
                onClick={() => refetch()}
                className={`${outlineButton} mt-5`}
              >
                Retry
              </button>
            )}
          </div>
        ) : students.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <p className="text-lg font-bold text-stone-900">
              No students found
            </p>
            <p className="mt-1.5 text-sm text-stone-500">
              {search
                ? 'Nothing matches your current search.'
                : 'Create your first student to get started.'}
            </p>
            {search ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className={`${outlineButton} mt-5`}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewStudent(true)}
                className={`${blackButton} mt-5`}
              >
                + New Student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr>
                  {['Student', 'Email', 'Joined', 'Last login', 'Status'].map(
                    (heading) => (
                      <th key={heading} className={`${monoLabel} px-4 py-3`}>
                        {heading}
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showNewStudent && (
        <Modal title="New Student" onClose={() => setShowNewStudent(false)}>
          <AddStudentForm onDone={() => setShowNewStudent(false)} />
        </Modal>
      )}
    </div>
  )
}
