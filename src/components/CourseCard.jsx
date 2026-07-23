import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { firstLessonPath } from '../data/courses.js'
import {
  selectCompletedForCourse,
  selectCourseProgress,
} from '../store/coursesSlice.js'
import { StarIcon } from './Icons.jsx'
import CourseProgress from './CourseProgress.jsx'

const bannerByCategory = {
  design: 'bg-gradient-to-br from-blue-100 via-violet-100 to-pink-100',
  tech: 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600',
  business: 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-blue-200',
}

export default function CourseCard({ course }) {
  const lessonPath = firstLessonPath(course)
  const progress = useSelector((state) => selectCourseProgress(state, course))
  const doneCount = useSelector(
    (state) => Object.keys(selectCompletedForCourse(state, course.id)).length,
  )
  const totalLessons = course.lessons.length

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`relative h-42 ${bannerByCategory[course.category.toLowerCase()] ?? bannerByCategory.design}`}
      >
        <span className="absolute top-3.5 left-3.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-900">
          {course.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1.5 text-sm text-gray-500">
          {course.rating > 0 ? (
            <>
              <span className="text-blue-700">
                <StarIcon />
              </span>
              <strong className="font-semibold text-gray-900">
                {course.rating.toFixed(1)}
              </strong>
              <span>({course.ratingCount})</span>
            </>
          ) : (
            <span className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">
              Not rated yet
            </span>
          )}
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="flex-1 text-sm text-gray-500">{course.description}</p>
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
            {course.meta}
          </span>
          {lessonPath ? (
            <Link
              to={lessonPath}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              {course.cta}
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
