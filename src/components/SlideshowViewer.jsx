import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, FullscreenExitIcon, FullscreenIcon, PlayCircleIcon } from './Icons.jsx'
import { useMarkSlideVisitedMutation } from '../store/coursesApi.js'

export default function SlideshowViewer({ lesson, courseId }) {
  const slides = lesson.slides ?? []
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [markVisited] = useMarkSlideVisitedMutation()

  // A freshly loaded (or re-imported) lesson should always open on slide 1.
  useEffect(() => setCurrentIndex(0), [lesson.id])

  // Esc (or any other browser-native exit) needs to be reflected in the
  // button's icon/label too, not just a click on the button itself.
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }

  // A slideshow tops out around a few dozen slides, so a plain map on every
  // render is cheaper than the bookkeeping a memoized version would need.
  const idToIndex = Object.fromEntries(slides.map((s, i) => [s.id, i]))
  const slide = slides[Math.min(currentIndex, Math.max(slides.length - 1, 0))]

  // Every slide the student actually looks at counts as "visited" — the
  // backend gates "Mark as Complete" on every *required* slide having one
  // of these, mirroring how video lessons gate on watch time.
  useEffect(() => {
    if (slide) markVisited({ courseId, lessonId: lesson.id, slideId: slide.id })
  }, [slide, courseId, lesson.id, markVisited])

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
        <span className="text-blue-700">
          <PlayCircleIcon size={40} />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <p className="text-gray-500">This slideshow doesn't have any slides yet.</p>
      </div>
    )
  }

  const goTo = (index) => {
    if (index >= 0 && index < slides.length) setCurrentIndex(index)
  }
  const jump = (hotspot) => {
    const index = idToIndex[hotspot.target]
    if (index !== undefined) setCurrentIndex(index)
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-gray-200 bg-white p-8 [&:fullscreen]:flex [&:fullscreen]:h-full [&:fullscreen]:flex-col [&:fullscreen]:justify-center"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Slide {currentIndex + 1} of {slides.length}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {isFullscreen ? <FullscreenExitIcon size={16} /> : <FullscreenIcon size={16} />}
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img src={slide.image} alt={`Slide ${currentIndex + 1}`} className="block w-full" />
        {slide.hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jump(h)}
            aria-label={`Go to slide ${(idToIndex[h.target] ?? 0) + 1}`}
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

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40"
        >
          <ArrowIcon direction="left" size={14} /> Previous
        </button>
        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === slides.length - 1}
          className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-default disabled:opacity-40"
        >
          Next <ArrowIcon direction="right" size={14} />
        </button>
      </div>
    </div>
  )
}
