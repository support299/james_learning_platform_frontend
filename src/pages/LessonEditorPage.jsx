import { useState, lazy, Suspense } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectCourseById,
  addLesson,
  updateLesson,
} from '../store/coursesSlice.js'
import { slugify, uniqueSlug } from '../utils/adminHelpers.js'
import { lessonToHtml } from '../utils/lessonHtml.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { Field, inputClass } from '../components/adminUi.jsx'
import { ArrowIcon } from '../components/Icons.jsx'

const RichTextEditor = lazy(() => import('../components/RichTextEditor.jsx'))

function NotFound({ children }) {
  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">{children}</h1>
        <Link
          to="/admin"
          className="mt-4 inline-block text-sm font-semibold text-orange-600 underline"
        >
          Back to courses
        </Link>
      </main>
    </div>
  )
}

function LessonEditor({ course, lesson }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isEdit = Boolean(lesson)
  const backTo = `/admin/course/${course.id}`

  const [title, setTitle] = useState(lesson?.title ?? '')
  const [duration, setDuration] = useState(lesson?.duration ?? '')
  const [overview, setOverview] = useState(lesson?.overview ?? '')
  const [content, setContent] = useState(() => lessonToHtml(lesson))

  const canSave = title.trim() !== '' && content.trim() !== ''

  const save = () => {
    if (!canSave) return
    const data = {
      title: title.trim(),
      type: 'text',
      html: content,
      ...(duration.trim() && { duration: duration.trim() }),
      ...(overview.trim() && { overview: overview.trim() }),
    }
    if (isEdit) {
      dispatch(
        updateLesson({ courseId: course.id, lessonId: lesson.id, lesson: data }),
      )
    } else {
      const id = uniqueSlug(
        slugify(title),
        course.lessons.map((l) => l.id),
      )
      dispatch(
        addLesson({
          courseId: course.id,
          lesson: { id, ...data },
          updatedAt: new Date().toISOString(),
        }),
      )
    }
    navigate(backTo)
  }

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />

      <div className="sticky top-0 z-30 h-16 border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={backTo}
              aria-label={`Back to ${course.title}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
            >
              <ArrowIcon direction="left" size={16} />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-stone-400">
                {course.title}
              </p>
              <h1 className="truncate text-base font-bold tracking-tight text-stone-900">
                {isEdit ? 'Edit lesson' : 'New lesson'}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-lg bg-stone-950 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-default disabled:opacity-40"
            >
              {isEdit ? 'Save changes' : 'Create lesson'}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none"
          autoFocus
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-[180px_1fr]">
          <Field label="Duration / label">
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 12 min"
              className={inputClass}
            />
          </Field>
          <Field label="Overview (optional)">
            <input
              type="text"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="A one-line summary for the lesson's Overview tab."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-8">
          <Suspense
            fallback={
              <div className="min-h-[480px] animate-pulse rounded-xl border border-stone-300 bg-stone-50" />
            }
          >
            <RichTextEditor value={content} onChange={setContent} />
          </Suspense>
          <p className="mt-2 text-xs text-stone-500">
            Build the lesson with headers, lists, highlights, and links. Use the
            video button to embed a YouTube, Loom, or Vimeo link anywhere.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams()
  const course = useSelector((state) => selectCourseById(state, courseId))

  if (!course) return <NotFound>Course not found</NotFound>

  const lesson = lessonId
    ? course.lessons.find((l) => l.id === lessonId)
    : null
  if (lessonId && !lesson) return <NotFound>Lesson not found</NotFound>

  // Key on the lesson so switching between lessons re-seeds the form state.
  return <LessonEditor key={lessonId ?? 'new'} course={course} lesson={lesson} />
}
