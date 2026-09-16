import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
  useReorderLessonsMutation,
  useDeleteLessonMutation,
  useImportCoursePptxMutation,
} from '../store/coursesApi.js'
import { firstLessonPath } from '../data/courses.js'
import SiteHeader from '../components/SiteHeader.jsx'
import {
  ConfirmModal,
  Modal,
  Field,
  inputClass,
  blackButton,
  outlineButton,
  monoLabel,
} from '../components/adminUi.jsx'
import {
  ChevronIcon,
  GripIcon,
  TrashIcon,
  PencilIcon,
  PlayCircleIcon,
  DocIcon,
  QuizIcon,
  SlideshowIcon,
  ImageIcon,
  ArrowIcon,
} from '../components/Icons.jsx'

function lessonIcon(lesson) {
  if (lesson.type === 'text') return <DocIcon />
  if (lesson.type === 'quiz') return <QuizIcon />
  if (lesson.type === 'slideshow') return <SlideshowIcon />
  if (lesson.type === 'image') return <ImageIcon />
  return <PlayCircleIcon />
}

function lessonMeta(lesson) {
  if (lesson.type === 'video') return `Video • ${lesson.duration}`
  if (lesson.type === 'text')
    return lesson.duration ? `Reading • ${lesson.duration}` : 'Lesson'
  if (lesson.type === 'slideshow') {
    const count = lesson.slideCount ?? 0
    return `${count} Slide${count === 1 ? '' : 's'}`
  }
  if (lesson.type === 'image') {
    const count = lesson.hotspotCount ?? 0
    return count ? `${count} Jump${count === 1 ? '' : 's'}` : 'Image'
  }
  return lesson.meta ?? `${lesson.questionCount ?? 0} Questions`
}

function Shell({ children }) {
  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-8 py-10">{children}</main>
    </div>
  )
}

function CourseDetailsForm({ course }) {
  const [updateCourse, { isLoading }] = useUpdateCourseMutation()
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const dirty =
    title.trim() !== course.title ||
    description.trim() !== (course.description ?? '')
  const canSave = title.trim() !== '' && dirty && !isLoading

  const save = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await updateCourse({
        id: course.id,
        title: title.trim(),
        description: description.trim(),
      }).unwrap()
      setSaved(true)
    } catch {
      setError('Could not save. Is the API running?')
    }
  }

  return (
    <form
      onSubmit={save}
      onChange={() => setSaved(false)}
      className="space-y-5 border border-stone-200 bg-white p-6"
    >
      <Field label="Course Title">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={!canSave} className={blackButton}>
          {isLoading ? 'Saving…' : 'Save changes'}
        </button>
        {saved && !dirty && (
          <span className="text-sm font-medium text-emerald-700">Saved.</span>
        )}
        {error && <span className="text-sm font-medium text-red-600">{error}</span>}
      </div>
    </form>
  )
}

function LessonRow({
  course,
  lesson,
  index,
  total,
  isDragging,
  isOver,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
  onMove,
}) {
  const [deleteLesson] = useDeleteLessonMutation()
  const [confirming, setConfirming] = useState(false)
  const isQuiz = lesson.type === 'quiz'
  const isSlideshow = lesson.type === 'slideshow'
  const isImage = lesson.type === 'image'
  const editPath = isQuiz
    ? `/admin/course/${course.id}/quiz/${lesson.id}/edit`
    : isSlideshow
      ? `/admin/course/${course.id}/slideshow/${lesson.id}/edit`
      : isImage
        ? `/admin/course/${course.id}/lesson/${lesson.id}/image-edit`
        : `/admin/course/${course.id}/lesson/${lesson.id}/edit`
  const kindLabel = isQuiz ? 'quiz' : isSlideshow ? 'slideshow' : isImage ? 'image lesson' : 'lesson'

  const remove = () => {
    deleteLesson({ courseId: course.id, lessonId: lesson.id })
    setConfirming(false)
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 border bg-white px-4 py-3 transition-colors ${
        isDragging
          ? 'border-orange-500 opacity-50'
          : isOver
            ? 'border-orange-400 bg-orange-50'
            : 'border-stone-200'
      }`}
    >
      <span
        className="cursor-grab text-stone-400 hover:text-stone-700 active:cursor-grabbing"
        aria-hidden="true"
      >
        <GripIcon />
      </span>

      <span className="w-6 shrink-0 text-center font-mono text-xs text-stone-400">
        {index + 1}
      </span>

      <span className="shrink-0 text-stone-400">{lessonIcon(lesson)}</span>

      <span className="min-w-0 flex-1">
        <Link
          to={editPath}
          className="block truncate text-sm font-semibold text-stone-900 hover:text-orange-600"
        >
          {lesson.title}
        </Link>
        <span className={`${monoLabel} normal-case`}>{lessonMeta(lesson)}</span>
      </span>

      <span className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onMove(index - 1)}
          disabled={index === 0}
          aria-label="Move lesson up"
          className="flex size-8 items-center justify-center text-stone-500 hover:text-stone-900 disabled:opacity-25"
        >
          <ChevronIcon direction="up" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index + 1)}
          disabled={index === total - 1}
          aria-label="Move lesson down"
          className="flex size-8 items-center justify-center text-stone-500 hover:text-stone-900 disabled:opacity-25"
        >
          <ChevronIcon direction="down" />
        </button>
        <Link
          to={editPath}
          aria-label={`Edit ${kindLabel}`}
          className="flex size-8 items-center justify-center text-stone-400 hover:text-orange-600"
        >
          <PencilIcon size={16} />
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${kindLabel}`}
          className="flex size-8 items-center justify-center text-stone-400 hover:text-red-600"
        >
          <TrashIcon size={16} />
        </button>
      </span>
      {confirming && (
        <ConfirmModal
          title={`Delete ${kindLabel}`}
          message={`Delete "${lesson.title}"? This cannot be undone.`}
          onConfirm={remove}
          onClose={() => setConfirming(false)}
        />
      )}
    </li>
  )
}

export default function CourseEditPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { data: course, isLoading, isError, refetch } = useGetCourseQuery(courseId)
  const [reorderLessons] = useReorderLessonsMutation()
  const [importCoursePptx, { isLoading: importing }] = useImportCoursePptxMutation()

  // Local copy of the lesson order for instant drag feedback; re-synced
  // whenever the server data changes (after add/delete/reorder).
  const [lessons, setLessons] = useState([])
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const [showImportPicker, setShowImportPicker] = useState(false)
  const [importMode, setImportMode] = useState(null)
  const [importError, setImportError] = useState(null)
  const importInputRef = useRef(null)

  useEffect(() => {
    if (course) setLessons(course.lessons)
  }, [course])

  const isPendingImport = course?.importStatus === 'pending'

  useEffect(() => {
    if (!isPendingImport) return
    const id = setInterval(refetch, 2000)
    return () => clearInterval(id)
  }, [isPendingImport, refetch])

  if (isLoading) {
    return (
      <Shell>
        <p className="py-20 text-center text-stone-500">Loading course…</p>
      </Shell>
    )
  }

  if (isError || !course) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Course not found</h1>
          <Link
            to="/admin"
            className="mt-4 inline-block text-sm font-semibold text-orange-600 underline"
          >
            Back to courses
          </Link>
        </div>
      </Shell>
    )
  }

  const persistOrder = (next) => {
    setLessons(next)
    reorderLessons({ courseId: course.id, lessonIds: next.map((l) => l.id) })
  }

  const move = (from, to) => {
    if (to < 0 || to >= lessons.length) return
    const next = [...lessons]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persistOrder(next)
  }

  const handleDrop = (targetIndex) => {
    if (dragIndex !== null && dragIndex !== targetIndex) move(dragIndex, targetIndex)
    setDragIndex(null)
    setOverIndex(null)
  }

  const pickImportMode = (mode) => {
    setImportMode(mode)
    setShowImportPicker(false)
    importInputRef.current?.click()
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !importMode) return
    setImportError(null)
    try {
      const result = await importCoursePptx({ courseId: course.id, mode: importMode, file }).unwrap()
      if (importMode === 'slideshow' && result?.lesson?.id) {
        navigate(`/admin/course/${course.id}/slideshow/${result.lesson.id}/edit`)
      }
    } catch (err) {
      setImportError(err?.data?.detail || err?.data?.file || err?.data?.mode || 'Could not start the import.')
    }
  }

  const studentPath = firstLessonPath({ ...course, lessons })
  const newLessonPath = `/admin/course/${course.id}/lesson/new`
  const newQuizPath = `/admin/course/${course.id}/quiz/new`
  const newSlideshowPath = `/admin/course/${course.id}/slideshow/new`

  return (
    <Shell>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900"
      >
        <ArrowIcon direction="left" size={15} /> All courses
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
            {course.title}
          </h1>
          <p className="mt-1.5 text-stone-500">
            Edit course details and organize its lessons.
          </p>
        </div>
        {studentPath && (
          <Link
            to={studentPath}
            className="border border-stone-300 bg-white px-5 py-3 font-mono text-xs font-semibold tracking-[0.15em] text-stone-800 uppercase hover:bg-stone-100"
          >
            View as student
          </Link>
        )}
      </div>

      <CourseDetailsForm course={course} />

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">
          Lessons{' '}
          <span className="font-mono text-sm font-normal text-stone-400">
            ({lessons.length})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={() => setShowImportPicker(true)}
            disabled={importing || isPendingImport}
            className={`${outlineButton} disabled:cursor-default disabled:opacity-40`}
          >
            {importing || isPendingImport ? 'Importing…' : 'Import PPTX'}
          </button>
          <button
            type="button"
            onClick={() => navigate(newSlideshowPath)}
            className={outlineButton}
          >
            + Add Slideshow
          </button>
          <button
            type="button"
            onClick={() => navigate(newQuizPath)}
            className={outlineButton}
          >
            + Add Quiz
          </button>
          <button
            type="button"
            onClick={() => navigate(newLessonPath)}
            className={blackButton}
          >
            + Add Lesson
          </button>
        </div>
      </div>

      {importError && (
        <p className="mb-4 text-sm font-medium text-red-600">{importError}</p>
      )}
      {isPendingImport && (
        <div className="mb-4 border border-stone-300 bg-white px-4 py-3 text-sm text-stone-600">
          Importing your .pptx — this can take a little while for large decks…
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="flex w-full flex-col items-center justify-center gap-2 border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
          <span className="text-sm font-semibold text-stone-700">
            No lessons yet
          </span>
          <span className="text-sm text-stone-500">
            Add your first lesson, quiz, or slideshow to get started.
          </span>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate(newLessonPath)}
              className={blackButton}
            >
              + Add Lesson
            </button>
            <button
              type="button"
              onClick={() => navigate(newQuizPath)}
              className={outlineButton}
            >
              + Add Quiz
            </button>
            <button
              type="button"
              onClick={() => navigate(newSlideshowPath)}
              className={outlineButton}
            >
              + Add Slideshow
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={`${monoLabel} mb-3`}>Drag to reorder</p>
          <ul className="space-y-2">
            {lessons.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                course={course}
                lesson={lesson}
                index={index}
                total={lessons.length}
                isDragging={dragIndex === index}
                isOver={overIndex === index && dragIndex !== index}
                onDragStart={() => setDragIndex(index)}
                onDragEnter={() => setOverIndex(index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onMove={(to) => move(index, to)}
              />
            ))}
          </ul>
        </>
      )}

      {showImportPicker && (
        <Modal title="Import PPTX" onClose={() => setShowImportPicker(false)} size="sm">
          <p className="text-sm leading-relaxed text-stone-600">
            Import every slide as one new slideshow lesson, or as its own lesson with
            jump points to other lessons in this course.
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => pickImportMode('slideshow')}
              className="block w-full border border-stone-300 bg-white px-4 py-3 text-left hover:border-stone-500"
            >
              <span className="block text-sm font-semibold text-stone-900">Import as slideshow</span>
              <span className="block text-sm text-stone-500">All slides become one new slideshow lesson.</span>
            </button>
            <button
              type="button"
              onClick={() => pickImportMode('lesson')}
              className="block w-full border border-stone-300 bg-white px-4 py-3 text-left hover:border-stone-500"
            >
              <span className="block text-sm font-semibold text-stone-900">Import as lesson</span>
              <span className="block text-sm text-stone-500">
                Each slide becomes its own lesson, with jump points wired between lessons.
              </span>
            </button>
          </div>
        </Modal>
      )}
    </Shell>
  )
}
