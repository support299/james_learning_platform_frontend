import { Link } from 'react-router-dom'
import { firstLessonPath } from '../data/courses.js'
import { useGetMyCompletionsQuery } from '../store/coursesApi.js'
import { completedCount, courseProgress } from '../utils/progress.js'
import CourseProgress from './CourseProgress.jsx'

const accentByCategory = {
  design: 'bg-violet-500',
  tech: 'bg-blue-600',
  business: 'bg-emerald-500',
}

export default function CourseCard({ course }) {
  const lessonPath = firstLessonPath(course)
  // RTK Query dedupes this across every card on the page into one request.
  const { data: completions = {} } = useGetMyCompletionsQuery()
  const progress = courseProgress(completions, course)
  const doneCount = completedCount(completions, course)
  const totalLessons = course.lessons.length

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`h-1 ${accentByCategory[course.category?.toLowerCase()] ?? accentByCategory.design}`}
      />
      <div className="flex flex-1 flex-col p-5">
        {course.category && (
          <span className="mb-1.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            {course.category}
          </span>
        )}
        <h2 className="mb-2 text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="mb-1 line-clamp-3 flex-1 text-sm text-gray-500">
          {course.description}
        </p>
        {totalLessons > 0 && (
          <CourseProgress
            value={progress}
            done={doneCount}
            total={totalLessons}
          />
        )}
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <span
            className={`text-sm font-semibold ${course.cta === 'Resume' ? 'text-blue-700' : 'text-gray-700'}`}
          >
            {course.meta ??
              `${totalLessons} lesson${totalLessons === 1 ? '' : 's'}`}
          </span>
          {lessonPath ? (
            <Link
              to={lessonPath}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              {course.cta ?? 'Start Learning'}
            </Link>
          ) : (
            <span className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400">
              No lessons yet
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
