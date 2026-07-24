import { useState, lazy, Suspense } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useGetCourseQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
} from '../store/coursesApi.js'
import { lessonToHtml } from '../utils/lessonHtml.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { Field, inputClass } from '../components/adminUi.jsx'
import { ArrowIcon } from '../components/Icons.jsx'

const RichTextEditor = lazy(() => import('../components/RichTextEditor.jsx'))

function Notice({ children }) {
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
  const navigate = useNavigate()
  const [createLesson, { isLoading: creating }] = useCreateLessonMutation()
  const [updateLesson, { isLoading: updating }] = useUpdateLessonMutation()
  const isEdit = Boolean(lesson)
  const backTo = `/admin/course/${course.id}`

  const [title, setTitle] = useState(lesson?.title ?? '')
  const [duration, setDuration] = useState(lesson?.duration ?? '')
  const [overview, setOverview] = useState(lesson?.overview ?? '')
  const [content, setContent] = useState(() => lessonToHtml(lesson))
  const [error, setError] = useState(null)

  const saving = creating || updating
  const canSave = title.trim() !== '' && content.trim() !== '' && !saving

  const save = async () => {
    if (!canSave) return
    setError(null)
    const data = {
      title: title.trim(),
      type: 'text',
      html: content,
      duration: duration.trim(),
      overview: overview.trim(),
    }
    try {
      if (isEdit) {
        await updateLesson({
          courseId: course.id,
          lessonId: lesson.id,
          lesson: data,
        }).unwrap()
      } else {
        await createLesson({ courseId: course.id, lesson: data }).unwrap()
      }
      navigate(backTo)
    } catch {
      setError('Could not save the lesson. Is the API running?')
    }
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
            {error && (
              <span className="hidden text-sm font-medium text-red-600 sm:inline">
                {error}
              </span>
            )}
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
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create lesson'}
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
  const { data: course, isLoading: courseLoading, isError: courseError } =
    useGetCourseQuery(courseId)
  const {
    data: lesson,
    isLoading: lessonLoading,
    isError: lessonError,
  } = useGetLessonQuery(
    { courseId, lessonId },
    { skip: !lessonId },
  )

  if (courseLoading || (lessonId && lessonLoading)) {
    return <Notice>Loading…</Notice>
  }
  if (courseError || !course) return <Notice>Course not found</Notice>
  if (lessonId && (lessonError || !lesson)) return <Notice>Lesson not found</Notice>

  // Key on the lesson so switching between lessons re-seeds the form state.
  return (
    <LessonEditor key={lessonId ?? 'new'} course={course} lesson={lesson ?? null} />
  )
}
