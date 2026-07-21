import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectCourseById,
  updateCourse,
  reorderLessons,
  deleteLesson,
} from '../store/coursesSlice.js'
import { firstLessonPath } from '../data/courses.js'
import SiteHeader from '../components/SiteHeader.jsx'
import {
  Field,
  inputClass,
  blackButton,
  monoLabel,
  courseCategories,
} from '../components/adminUi.jsx'
import {
  ChevronIcon,
  GripIcon,
  TrashIcon,
  PencilIcon,
  PlayCircleIcon,
  DocIcon,
  QuizIcon,
  ArrowIcon,
} from '../components/Icons.jsx'

function lessonIcon(lesson) {
  if (lesson.type === 'text') return <DocIcon />
  if (lesson.type === 'quiz') return <QuizIcon />
  return <PlayCircleIcon />
}

function lessonMeta(lesson) {
  if (lesson.type === 'video') return `Video • ${lesson.duration}`
  if (lesson.type === 'text')
    return lesson.duration ? `Reading • ${lesson.duration}` : 'Lesson'
  return lesson.meta ?? `${lesson.questionCount ?? 0} Questions`
}

function CourseDetailsForm({ course }) {
  const dispatch = useDispatch()
  const [title, setTitle] = useState(course.title)
  const [category, setCategory] = useState(course.category)
  const [description, setDescription] = useState(course.description)
  const [saved, setSaved] = useState(false)

  const dirty =
    title.trim() !== course.title ||
    category !== course.category ||
    description.trim() !== course.description
  const canSave = title.trim() !== '' && description.trim() !== '' && dirty

  const save = (e) => {
    e.preventDefault()
    dispatch(
      updateCourse({
        courseId: course.id,
        title: title.trim(),
        category,
        description: description.trim(),
      }),
    )
    setSaved(true)
  }

  return (
    <form
      onSubmit={save}
      onChange={() => setSaved(false)}
      className="space-y-5 border border-stone-200 bg-white p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Course Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {courseCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
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
          Save changes
        </button>
        {saved && !dirty && (
          <span className="text-sm font-medium text-emerald-700">Saved.</span>
        )}
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
  const dispatch = useDispatch()
  const editPath = `/admin/course/${course.id}/lesson/${lesson.id}/edit`

  const remove = () => {
    if (window.confirm(`Delete lesson "${lesson.title}"?`)) {
      dispatch(deleteLesson({ courseId: course.id, lessonId: lesson.id }))
    }
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
          aria-label="Edit lesson"
          className="flex size-8 items-center justify-center text-stone-400 hover:text-orange-600"
        >
          <PencilIcon size={16} />
        </Link>
        <button
          type="button"
          onClick={remove}
          aria-label="Delete lesson"
          className="flex size-8 items-center justify-center text-stone-400 hover:text-red-600"
        >
          <TrashIcon size={16} />
        </button>
      </span>
    </li>
  )
}

export default function CourseEditPage() {
  const { courseId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const course = useSelector((state) => selectCourseById(state, courseId))
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  if (!course) {
    return (
      <div className="min-h-svh bg-[#f6f5f2]">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-stone-900">
            Course not found
          </h1>
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

  const move = (from, to) => {
    if (to < 0 || to >= course.lessons.length) return
    dispatch(reorderLessons({ courseId: course.id, from, to }))
  }

  const handleDrop = (targetIndex) => {
    if (dragIndex !== null) move(dragIndex, targetIndex)
    setDragIndex(null)
    setOverIndex(null)
  }

  const studentPath = firstLessonPath(course)
  const newLessonPath = `/admin/course/${course.id}/lesson/new`

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl px-8 py-10">
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
              ({course.lessons.length})
            </span>
          </h2>
          <button
            type="button"
            onClick={() => navigate(newLessonPath)}
            className={blackButton}
          >
            + Add Lesson
          </button>
        </div>

        {course.lessons.length === 0 ? (
          <button
            type="button"
            onClick={() => navigate(newLessonPath)}
            className="flex w-full flex-col items-center justify-center gap-2 border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center hover:border-stone-400"
          >
            <span className="text-sm font-semibold text-stone-700">
              No lessons yet
            </span>
            <span className="text-sm text-stone-500">
              Add your first lesson to get started.
            </span>
          </button>
        ) : (
          <>
            <p className={`${monoLabel} mb-3`}>Drag to reorder</p>
            <ul className="space-y-2">
              {course.lessons.map((lesson, index) => (
                <LessonRow
                  key={lesson.id}
                  course={course}
                  lesson={lesson}
                  index={index}
                  total={course.lessons.length}
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
      </main>
    </div>
  )
}
