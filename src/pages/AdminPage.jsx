import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { firstLessonPath } from '../data/courses.js'
import {
  addCourse,
  deleteCourse,
  selectCourses,
} from '../store/coursesSlice.js'
import { slugify, uniqueSlug, formatDate } from '../utils/adminHelpers.js'
import CourseCard from '../components/CourseCard.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { DotsIcon } from '../components/Icons.jsx'
import {
  Modal,
  Field,
  PreviewHeading,
  inputClass,
  monoLabel,
  blackButton,
  courseCategories,
} from '../components/adminUi.jsx'

function AddCourseForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const courses = useSelector(selectCourses)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Design')
  const [description, setDescription] = useState('')

  const draft = {
    id: 'preview',
    title: title.trim() || 'Course Title',
    category,
    description:
      description.trim() || 'A short description of what this course covers.',
    rating: 0,
    ratingCount: '0',
    meta: 'New',
    cta: 'Start Learning',
    lessons: [],
  }

  const canSubmit = title.trim() !== '' && description.trim() !== ''

  const submit = (e) => {
    e.preventDefault()
    const id = uniqueSlug(
      slugify(title),
      courses.map((c) => c.id),
    )
    dispatch(
      addCourse({
        id,
        title: title.trim(),
        category,
        description: description.trim(),
        updatedAt: new Date().toISOString(),
      }),
    )
    // Take the author straight into the new course to add and arrange lessons.
    navigate(`/admin/course/${id}`)
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Course Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Systems 101"
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
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What will students learn?"
            className={inputClass}
          />
        </Field>
        <button type="submit" disabled={!canSubmit} className={blackButton}>
          + Create & Add Lessons
        </button>
      </form>

      <div>
        <PreviewHeading>Preview — catalog card</PreviewHeading>
        <div className="pointer-events-none max-w-sm">
          <CourseCard course={draft} />
        </div>
      </div>
    </div>
  )
}

function AdminCourseCard({ course, menuOpen, onToggleMenu }) {
  const dispatch = useDispatch()
  const lessonPath = firstLessonPath(course)
  const editPath = `/admin/course/${course.id}`

  const remove = () => {
    if (window.confirm(`Delete "${course.title}" and all its lessons?`)) {
      dispatch(deleteCourse(course.id))
    }
    onToggleMenu(null)
  }

  return (
    <article className="relative flex min-h-56 flex-col border border-stone-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={editPath}
          className="text-[22px] leading-snug font-bold tracking-tight text-stone-900 hover:text-orange-600"
        >
          {course.title}
        </Link>
        <button
          type="button"
          aria-label={`Options for ${course.title}`}
          onClick={() => onToggleMenu(menuOpen ? null : course.id)}
          className="-mt-1 -mr-2 flex size-8 shrink-0 items-center justify-center text-stone-500 hover:text-stone-900"
        >
          <DotsIcon />
        </button>
      </div>
      <span className={`${monoLabel} mt-2`}>
        {course.lessons.length} Lesson{course.lessons.length === 1 ? '' : 's'}
      </span>

      <div className="mt-auto flex items-center justify-between border-t border-stone-200 pt-4">
        <span className={monoLabel}>Last edited</span>
        <span className="font-mono text-xs tracking-[0.1em] text-stone-700 uppercase">
          {formatDate(course.updatedAt)}
        </span>
      </div>

      {menuOpen && (
        <div className="absolute top-12 right-4 z-20 w-44 border border-stone-200 bg-white shadow-lg">
          <Link
            to={editPath}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-stone-800 hover:bg-stone-100"
          >
            Edit course
          </Link>
          <Link
            to={`${editPath}/lesson/new`}
            className="block w-full px-4 py-2.5 text-left text-sm text-stone-800 hover:bg-stone-100"
          >
            Add lesson
          </Link>
          {lessonPath && (
            <Link
              to={lessonPath}
              className="block w-full px-4 py-2.5 text-left text-sm text-stone-800 hover:bg-stone-100"
            >
              View as student
            </Link>
          )}
          <button
            type="button"
            onClick={remove}
            className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete course
          </button>
        </div>
      )}
    </article>
  )
}

export default function AdminPage() {
  const courses = useSelector(selectCourses)
  const [showNewCourse, setShowNewCourse] = useState(false)
  const [menuFor, setMenuFor] = useState(null)

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />

      <main
        className="mx-auto w-full max-w-7xl px-8 py-10"
        onClick={() => menuFor && setMenuFor(null)}
      >
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
              Courses
            </h1>
            <p className="mt-1.5 text-stone-500">
              Manage and organize your curriculums.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCourse(true)}
            className={blackButton}
          >
            + New Course
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <AdminCourseCard
              key={course.id}
              course={course}
              menuOpen={menuFor === course.id}
              onToggleMenu={setMenuFor}
            />
          ))}

          <button
            type="button"
            onClick={() => setShowNewCourse(true)}
            aria-label="Create new course"
            className="flex min-h-56 flex-col border border-stone-200 bg-white p-6 text-left hover:border-stone-400"
          >
            <span className="h-5 w-3/4 bg-stone-100" />
            <span className="mt-3 h-3.5 w-2/5 bg-stone-100" />
            <span className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4">
              <span className="h-3.5 w-1/3 bg-stone-100" />
              <span className="h-3.5 w-1/4 bg-stone-100" />
            </span>
          </button>
        </div>
      </main>

      {showNewCourse && (
        <Modal title="New Course" onClose={() => setShowNewCourse(false)}>
          <AddCourseForm />
        </Modal>
      )}
    </div>
  )
}
