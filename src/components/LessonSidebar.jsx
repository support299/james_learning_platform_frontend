import { Link } from 'react-router-dom'
import { useGetMyCompletionsQuery } from '../store/coursesApi.js'
import { courseProgress } from '../utils/progress.js'
import {
  CheckCircleIcon,
  PlayCircleIcon,
  DocIcon,
  QuizIcon,
} from './Icons.jsx'

function lessonIcon(lesson, isCompleted) {
  if (isCompleted) return <CheckCircleIcon />
  if (lesson.type === 'text') return <DocIcon />
  if (lesson.type === 'quiz') return <QuizIcon />
  return <PlayCircleIcon />
}

function lessonMeta(lesson) {
  if (lesson.type === 'video') return `${lesson.duration} • Video`
  if (lesson.type === 'text')
    return lesson.duration ? `Reading • ${lesson.duration}` : 'Lesson'
  // Quiz summaries from the API carry no `meta` string, so fall back to the
  // question count rather than rendering "undefined".
  return lesson.meta ?? `${lesson.questionCount ?? 0} questions`
}

export default function LessonSidebar({ course, activeLessonId }) {
  const { data: completions = {} } = useGetMyCompletionsQuery()
  const completed = completions[course.id] ?? {}
  const progress = courseProgress(completions, course)

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-gray-200 bg-white lg:w-81">
      <div className="border-b border-gray-200 px-5 pt-5 pb-4">
        <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
          Current Course
        </span>
        <h2 className="mt-1 text-lg font-bold text-gray-900">{course.title}</h2>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="h-full rounded-full bg-blue-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="mt-1.5 block text-xs text-gray-500">
          {progress}% Complete
        </span>
      </div>

      <nav className="flex-1 py-2">
        {course.lessons.map((lesson, index) => {
          const isActive = lesson.id === activeLessonId
          return (
            <Link
              key={lesson.id}
              to={`/course/${course.id}/lesson/${lesson.id}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-start gap-3 border-r-3 px-5 py-3.5 ${
                isActive
                  ? 'border-blue-700 bg-blue-50'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <span
                className={`mt-0.5 ${
                  completed[lesson.id]
                    ? 'text-blue-700'
                    : isActive
                      ? 'text-blue-700'
                      : 'text-gray-400'
                }`}
              >
                {lessonIcon(lesson, completed[lesson.id])}
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold ${
                    isActive ? 'text-blue-700' : 'text-gray-800'
                  }`}
                >
                  {index + 1}. {lesson.title}
                </span>
                <span className="block text-xs text-gray-500">
                  {lessonMeta(lesson)}
                </span>
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
