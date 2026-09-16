import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useGetCourseQuery,
  useGetLessonQuery,
  useUpdateLessonMutation,
  useReplaceImageLessonImageMutation,
} from '../store/coursesApi.js'
import SiteHeader from '../components/SiteHeader.jsx'
import HotspotCanvas from '../components/HotspotCanvas.jsx'
import { Field, inputClass } from '../components/adminUi.jsx'
import { ArrowIcon } from '../components/Icons.jsx'

function Notice({ children }) {
  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">{children}</h1>
        <Link to="/admin" className="mt-4 inline-block text-sm font-semibold text-orange-600 underline">
          Back to courses
        </Link>
      </main>
    </div>
  )
}

function ImageLessonEditor({ course, lesson }) {
  const navigate = useNavigate()
  const backTo = `/admin/course/${course.id}`
  const [updateLesson, { isLoading: updating }] = useUpdateLessonMutation()
  const [replaceImage, { isLoading: replacing }] = useReplaceImageLessonImageMutation()

  const [title, setTitle] = useState(lesson.title)
  const [overview, setOverview] = useState(lesson.overview ?? '')
  const [hotspots, setHotspots] = useState(lesson.hotspots)
  const [image, setImage] = useState(lesson.image)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const replaceImageInputRef = useRef(null)

  const dirty =
    title.trim() !== lesson.title ||
    overview.trim() !== (lesson.overview ?? '') ||
    JSON.stringify(hotspots) !== JSON.stringify(lesson.hotspots)
  const canSave = title.trim() !== '' && dirty && !updating

  const cancel = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    navigate(backTo)
  }

  const save = async () => {
    if (!canSave) return
    setError(null)
    try {
      await updateLesson({
        courseId: course.id,
        lessonId: lesson.id,
        lesson: { title: title.trim(), type: 'image', overview: overview.trim(), hotspots },
      }).unwrap()
      setSaved(true)
    } catch {
      setError('Could not save the lesson. Is the API running?')
    }
  }

  const handleReplaceImageFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const updated = await replaceImage({ courseId: course.id, lessonId: lesson.id, file }).unwrap()
      setImage(updated.image)
    } catch {
      setError('Could not replace the image.')
    }
  }

  // Any other lesson in the course is a valid jump target — not just other
  // image lessons — so staff can wire a slide into a full course flow.
  const targets = course.lessons
    .filter((l) => l.id !== lesson.id)
    .map((l) => ({ id: l.id, label: l.title }))

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <div className="sticky top-0 z-30 h-16 border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={cancel}
              aria-label={`Back to ${course.title}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
            >
              <ArrowIcon direction="left" size={16} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-stone-400">{course.title}</p>
              <h1 className="truncate text-base font-bold tracking-tight text-stone-900">Edit image lesson</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {error && <span className="hidden text-sm font-medium text-red-600 sm:inline">{error}</span>}
            <button type="button" onClick={cancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-lg bg-stone-950 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-default disabled:opacity-40"
            >
              {updating ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setSaved(false)
          }}
          placeholder="Lesson title"
          className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none"
        />
        <div className="mt-6">
          <Field label="Overview (optional)">
            <input
              type="text"
              value={overview}
              onChange={(e) => {
                setOverview(e.target.value)
                setSaved(false)
              }}
              className={inputClass}
            />
          </Field>
        </div>

        {saved && !dirty && <p className="mt-3 text-sm font-medium text-emerald-700">Saved.</p>}

        <div className="mt-8 flex items-center justify-between">
          <span className={`font-mono text-[11px] font-medium tracking-[0.15em] text-stone-500 uppercase`}>
            Click and drag to draw a hotspot
          </span>
          <input
            ref={replaceImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReplaceImageFile}
          />
          <button
            type="button"
            onClick={() => replaceImageInputRef.current?.click()}
            disabled={replacing}
            className="text-sm font-semibold text-stone-600 hover:text-orange-600 disabled:cursor-default disabled:opacity-40"
          >
            {replacing ? 'Uploading…' : 'Replace image'}
          </button>
        </div>

        <div className="mt-3">
          <HotspotCanvas
            image={image}
            hotspots={hotspots}
            targets={targets}
            onAddHotspot={(hotspot) => {
              setHotspots((prev) => [...prev, hotspot])
              setSaved(false)
            }}
            onRetarget={(index, target) => {
              setHotspots((prev) => prev.map((h, i) => (i === index ? { ...h, target } : h)))
              setSaved(false)
            }}
            onDeleteHotspot={(index) => {
              setHotspots((prev) => prev.filter((_, i) => i !== index))
              setSaved(false)
            }}
          />
        </div>

        <p className="mt-6 text-xs text-stone-500">
          The image saves immediately when replaced. Title, overview and hotspots save when you
          click "Save changes".
        </p>
      </main>
    </div>
  )
}

export default function ImageLessonEditorPage() {
  const { courseId, lessonId } = useParams()
  const { data: course, isLoading: courseLoading, isError: courseError } = useGetCourseQuery(courseId)
  const { data: lesson, isLoading: lessonLoading, isError: lessonError } = useGetLessonQuery({ courseId, lessonId })

  if (courseLoading || lessonLoading) return <Notice>Loading…</Notice>
  if (courseError || !course) return <Notice>Course not found</Notice>
  if (lessonError || !lesson) return <Notice>Lesson not found</Notice>

  return <ImageLessonEditor key={lessonId} course={course} lesson={lesson} />
}
