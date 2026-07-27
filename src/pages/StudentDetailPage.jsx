import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGetCoursesQuery } from '../store/coursesApi.js'
import {
  useGetStudentQuery,
  useGetStudentCoursesQuery,
  useSetStudentCoursesMutation,
} from '../store/studentsApi.js'
import { formatDate } from '../utils/adminHelpers.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { ArrowIcon, SearchIcon } from '../components/Icons.jsx'
import {
  monoLabel,
  blackButton,
  outlineButton,
} from '../components/adminUi.jsx'

function Shell({ children }) {
  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-8 py-10">
        <Link
          to="/admin/students"
          className={`${monoLabel} inline-flex items-center gap-1.5 hover:text-stone-900`}
        >
          <ArrowIcon size={14} direction="left" /> Back to students
        </Link>
        {children}
      </main>
    </div>
  )
}

function StudentSummary({ student }) {
  const name = [student.firstName, student.lastName].filter(Boolean).join(' ')
  const facts = [
    ['Username', student.username],
    ['Email', student.email || '—'],
    ['Joined', formatDate(student.dateJoined)],
    ['Last login', formatDate(student.lastLogin)],
  ]

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
          {name || student.username}
        </h1>
        {!student.isActive && (
          <span className="bg-stone-200 px-2 py-1 font-mono text-[11px] font-medium tracking-[0.1em] text-stone-600 uppercase">
            Disabled
          </span>
        )}
      </div>
      <dl className="mt-5 grid gap-4 border-y border-stone-200 py-5 sm:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className={monoLabel}>{label}</dt>
            <dd className="mt-1 truncate text-sm text-stone-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function AssignedCourses({ studentId, studentName }) {
  const { data: courses = [], isLoading: loadingCourses } = useGetCoursesQuery()
  const {
    data: enrollments = [],
    isLoading: loadingEnrollments,
    isError,
  } = useGetStudentCoursesQuery(studentId)
  const [setStudentCourses, { isLoading: isSaving }] =
    useSetStudentCoursesMutation()

  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // The server's list is the source of truth; local edits start from it and
  // are re-seeded whenever it changes (first load, or after a save).
  const assignedIds = useMemo(
    () => enrollments.map((e) => e.courseId),
    [enrollments],
  )
  useEffect(() => {
    setSelected(new Set(assignedIds))
  }, [assignedIds])

  const detailsById = useMemo(
    () => Object.fromEntries(enrollments.map((e) => [e.courseId, e])),
    [enrollments],
  )

  const toggle = (courseId) => {
    setSaved(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const picked = selected ?? new Set()
  const dirty =
    selected !== null &&
    (picked.size !== assignedIds.length ||
      assignedIds.some((id) => !picked.has(id)))

  const save = async () => {
    setError(null)
    try {
      await setStudentCourses({
        id: studentId,
        courseIds: [...picked],
      }).unwrap()
      setSaved(true)
    } catch {
      setError('Could not save the assignments.')
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q),
    )
  }, [courses, query])

  if (loadingCourses || loadingEnrollments) {
    return (
      <p className="mt-8 text-sm text-stone-500">Loading course assignments…</p>
    )
  }

  if (isError) {
    return (
      <p className="mt-8 text-sm font-medium text-red-600">
        Could not load this student’s assignments.
      </p>
    )
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Assigned courses
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            {studentName} sees only the courses ticked here.
          </p>
        </div>
        <span className={monoLabel}>
          {picked.size} of {courses.length} assigned
        </span>
      </div>

      {courses.length === 0 ? (
        <div className="mt-5 border border-dashed border-stone-300 bg-white/50 p-10 text-center">
          <p className="text-lg font-bold text-stone-900">No courses yet</p>
          <p className="mt-1.5 text-sm text-stone-500">
            Create a course before assigning one.
          </p>
          <Link to="/admin" className={`${outlineButton} mt-5 inline-block`}>
            Go to courses
          </Link>
        </div>
      ) : (
        <>
          {courses.length > 6 && (
            <label className="mt-5 flex items-center gap-2.5 border border-stone-300 bg-white px-3.5 py-2.5 text-stone-400 focus-within:border-orange-600 sm:w-72">
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter courses..."
                className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
            </label>
          )}

          <ul className="mt-5 divide-y divide-stone-200 border border-stone-200 bg-white">
            {visible.map((course) => {
              const isChecked = picked.has(course.id)
              const detail = detailsById[course.id]
              const lessonCount = course.lessons?.length ?? course.lessonCount ?? 0
              return (
                <li key={course.id}>
                  <label className="flex cursor-pointer items-start gap-3.5 p-4 hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(course.id)}
                      className="mt-1 size-4 shrink-0 accent-stone-950"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-stone-900">
                        {course.title}
                      </span>
                      <span className={`${monoLabel} mt-1 block`}>
                        {lessonCount} Lesson{lessonCount === 1 ? '' : 's'}
                        {detail && (
                          <>
                            {' · Assigned '}
                            {formatDate(detail.assignedAt)}
                            {detail.assignedBy ? ` by ${detail.assignedBy}` : ''}
                          </>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
            {visible.length === 0 && (
              <li className="p-4 text-sm text-stone-500">
                No courses match that filter.
              </li>
            )}
          </ul>

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || isSaving}
              className={blackButton}
            >
              {isSaving ? 'Saving…' : 'Save assignments'}
            </button>
            {dirty ? (
              <span className={monoLabel}>Unsaved changes</span>
            ) : (
              saved && <span className={monoLabel}>Saved</span>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default function StudentDetailPage() {
  const { studentId } = useParams()
  const { data: student, isLoading, isError } = useGetStudentQuery(studentId)

  if (isLoading) {
    return (
      <Shell>
        <p className="mt-8 text-sm text-stone-500">Loading student…</p>
      </Shell>
    )
  }

  if (isError || !student) {
    return (
      <Shell>
        <div className="mt-8 border border-dashed border-red-300 bg-red-50/50 p-10 text-center">
          <p className="text-lg font-bold text-stone-900">Student not found</p>
          <p className="mt-1.5 text-sm text-stone-500">
            They may have been deleted.
          </p>
          <Link
            to="/admin/students"
            className={`${outlineButton} mt-5 inline-block`}
          >
            Back to students
          </Link>
        </div>
      </Shell>
    )
  }

  const displayName =
    [student.firstName, student.lastName].filter(Boolean).join(' ') ||
    student.username

  return (
    <Shell>
      <StudentSummary student={student} />
      <AssignedCourses studentId={student.id} studentName={displayName} />
    </Shell>
  )
}
