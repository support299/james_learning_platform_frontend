import { Link, useParams } from 'react-router-dom'
import {
  useGetCourseQuery,
  useGetLessonQuery,
  useGetMyCompletionsQuery,
  useSetLessonCompleteMutation,
} from '../store/coursesApi.js'
import LessonSidebar from '../components/LessonSidebar.jsx'
import LessonContent from '../components/LessonContent.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { ArrowIcon, CheckCircleIcon } from '../components/Icons.jsx'

function Shell({ children }) {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {children}
      </main>
      <SiteFooter links={['Privacy Policy', 'Terms of Service', 'Support']} />
    </div>
  )
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams()

  // The course gives us the sidebar + prev/next order; the lesson endpoint is
  // what carries the body (html/objectives/proTip) — the course payload only
  // includes lesson summaries.
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useGetCourseQuery(courseId)
  const {
    data: lesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useGetLessonQuery({ courseId, lessonId })

  const { data: completions = {} } = useGetMyCompletionsQuery()
  const [setLessonComplete, { isLoading: isSaving }] =
    useSetLessonCompleteMutation()

  if (courseLoading || lessonLoading) {
    return (
      <Shell>
        <p className="py-20 text-center text-gray-500">Loading lesson…</p>
      </Shell>
    )
  }

  const error = courseError ?? lessonError
  if (error || !course || !lesson) {
    const missing = error?.status === 404 || !course || !lesson
    return (
      <Shell>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {missing ? 'Lesson not found' : 'Couldn’t reach the API'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {missing
              ? 'It may have been deleted or renamed.'
              : 'Make sure the Django server is running on port 8000.'}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Back to courses
          </Link>
        </div>
      </Shell>
    )
  }

  // Match on id, not object identity: `lesson` comes from the detail endpoint
  // and is a different object from its summary in `course.lessons`.
  const index = course.lessons.findIndex((l) => l.id === lesson.id)
  const prev = index > 0 ? course.lessons[index - 1] : undefined
  const next = index === -1 ? undefined : course.lessons[index + 1]
  const isCompleted = Boolean(completions[course.id]?.[lesson.id])

  const navButtonClass =
    'flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40'

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader />

      <div className="flex flex-1 flex-col lg:flex-row">
        <LessonSidebar course={course} activeLessonId={lesson.id} />

        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-2.5 text-sm"
          >
            <Link
              to="/"
              className="group -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-700"
            >
              <span className="transition-transform duration-150 group-hover:-translate-x-0.5">
                <ArrowIcon direction="left" size={15} />
              </span>
              Courses
            </Link>
            <span aria-hidden="true" className="h-3.5 w-px bg-gray-200" />
            <span className="truncate text-gray-500">{course.title}</span>
          </nav>
          <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-gray-900">
            {lesson.title}
          </h1>

          <LessonContent lesson={lesson} />

          <div className="space-y-5 py-7">
            {lesson.overview && (
              <p className="text-[17px] leading-relaxed text-gray-700">
                {lesson.overview}
              </p>
            )}
            {lesson.objectives?.length > 0 && (
              <div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">
                  Key Learning Objectives
                </h2>
                <ul className="list-disc space-y-2 pl-6 text-gray-700">
                  {lesson.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
            {lesson.proTip && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-6 py-5">
                <strong className="mb-1.5 block text-sm font-bold tracking-wide text-blue-700 uppercase">
                  Pro Tip
                </strong>
                <p className="text-[15px] text-gray-700 italic">
                  "{lesson.proTip}"
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-7">
            <div className="flex gap-3">
              {prev ? (
                <Link
                  to={`/course/${course.id}/lesson/${prev.id}`}
                  className={navButtonClass}
                >
                  <ArrowIcon direction="left" /> Previous Lesson
                </Link>
              ) : (
                <button type="button" disabled className={navButtonClass}>
                  <ArrowIcon direction="left" /> Previous Lesson
                </button>
              )}
              {next ? (
                <Link
                  to={`/course/${course.id}/lesson/${next.id}`}
                  className={navButtonClass}
                >
                  Next Lesson <ArrowIcon />
                </Link>
              ) : (
                <button type="button" disabled className={navButtonClass}>
                  Next Lesson <ArrowIcon />
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                setLessonComplete({
                  courseId: course.id,
                  lessonId: lesson.id,
                  completed: !isCompleted,
                })
              }
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                isCompleted
                  ? 'bg-green-700 hover:bg-green-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <CheckCircleIcon size={18} />
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </main>
      </div>

      <SiteFooter links={['Privacy Policy', 'Terms of Service', 'Support']} />
    </div>
  )
}
