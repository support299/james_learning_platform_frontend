import { useNavigate } from 'react-router-dom'
import { ImageIcon } from './Icons.jsx'

export default function ImageLessonViewer({ lesson, courseId }) {
  const navigate = useNavigate()

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

  const jump = (hotspot) => navigate(`/course/${courseId}/lesson/${hotspot.target}`)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8">
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img src={lesson.image} alt={lesson.title} className="block w-full" />
        {lesson.hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jump(h)}
            aria-label="Jump to lesson"
            className="absolute cursor-pointer rounded border-2 border-transparent hover:border-blue-500 hover:bg-blue-500/10"
            style={{
              left: `${h.x * 100}%`,
              top: `${h.y * 100}%`,
              width: `${h.w * 100}%`,
              height: `${h.h * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
