import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getLesson } from '../data/courses.js'
import {
  toggleLessonComplete,
  selectCompletedForCourse,
  selectCourseById,
} from '../store/coursesSlice.js'
import LessonSidebar from '../components/LessonSidebar.jsx'
import LessonContent from '../components/LessonContent.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { ArrowIcon, CheckCircleIcon } from '../components/Icons.jsx'

const TABS = ['Overview', 'Resources', 'Discussion']

export default function LessonPage() {
  const { courseId, lessonId } = useParams()
  const dispatch = useDispatch()
  const [tab, setTab] = useState('Overview')

  const course = useSelector((state) => selectCourseById(state, courseId))
  const lesson = getLesson(course, lessonId)
  const completed = useSelector((state) =>
    selectCompletedForCourse(state, courseId),
  )

  if (!course || !lesson) return <Navigate to="/" replace />

  const index = course.lessons.indexOf(lesson)
  const prev = course.lessons[index - 1]
  const next = course.lessons[index + 1]
  const isCompleted = Boolean(completed[lesson.id])

  const navButtonClass =
    'flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40'

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader showSearch searchPlaceholder="Search lessons..." showNotifications />

      <div className="flex flex-1 flex-col lg:flex-row">
        <LessonSidebar course={course} activeLessonId={lesson.id} />

        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 lg:px-12">
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-700">
              Courses
            </Link>
            <span aria-hidden="true">›</span>
            <span>{course.title}</span>
          </nav>
          <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-gray-900">
            {lesson.title}
          </h1>

          <LessonContent lesson={lesson} />

          <div role="tablist" className="mt-8 flex gap-8 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tab}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-3 text-[15px] ${
                  t === tab
                    ? 'border-blue-700 font-semibold text-blue-700'
                    : 'border-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="py-7">
            {tab === 'Overview' && (
              <div className="space-y-5">
                {lesson.overview && (
                  <p className="text-[17px] leading-relaxed text-gray-700">
                    {lesson.overview}
                  </p>
                )}
                {lesson.objectives && (
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
            )}
            {tab === 'Resources' && (
              <p className="text-gray-500">
                Downloadable resources for this lesson will appear here.
              </p>
            )}
            {tab === 'Discussion' && (
              <p className="text-gray-500">
                Join the discussion — comments are not available in this
                prototype.
              </p>
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
              onClick={() =>
                dispatch(
                  toggleLessonComplete({
                    courseId: course.id,
                    lessonId: lesson.id,
                  }),
                )
              }
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white ${
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
