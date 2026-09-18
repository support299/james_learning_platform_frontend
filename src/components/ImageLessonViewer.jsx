import { useNavigate } from 'react-router-dom'
import { ImageIcon } from './Icons.jsx'
import { useGetMyCompletionsQuery } from '../store/coursesApi.js'
import { isLessonUnlocked } from '../utils/lessonUnlock.js'

export default function ImageLessonViewer({ lesson, courseId, course }) {
  const navigate = useNavigate()
  const { data: completions = {} } = useGetMyCompletionsQuery()

  if (!lesson.image) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
        <span className="text-blue-700">
          <ImageIcon size={40} />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <p className="text-gray-500">This lesson doesn't have an image yet.</p>
      </div>
    )
  }

  // A hotspot can still jump to any authored target lesson (the author's
  // graph is preserved), but only if every lesson up to that target is
  // already completed — a leapfrog is fine as long as everything in between
  // happens to already be done, matching Next's own order gate.
  const jump = (hotspot) => {
    if (!isLessonUnlocked(course, completions, hotspot.target)) return
    navigate(`/course/${courseId}/lesson/${hotspot.target}`)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8">
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img src={lesson.image} alt={lesson.title} className="block w-full" />
        {lesson.hotspots.map((h, i) => {
          const unlocked = isLessonUnlocked(course, completions, h.target)
          return (
            <button
              key={i}
              type="button"
              onClick={() => jump(h)}
              aria-label="Jump to lesson"
              aria-disabled={!unlocked}
              title={unlocked ? undefined : 'Complete earlier lessons first'}
              className={`absolute rounded border-2 border-transparent ${
                unlocked
                  ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-500/10'
                  : 'cursor-not-allowed'
              }`}
              style={{
                left: `${h.x * 100}%`,
                top: `${h.y * 100}%`,
                width: `${h.w * 100}%`,
                height: `${h.h * 100}%`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
