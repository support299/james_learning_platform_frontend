import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { firstLessonPath, categories } from '../data/courses.js'
import {
  addCourse,
  deleteCourse,
  selectCourses,
} from '../store/coursesSlice.js'
import { slugify, uniqueSlug, formatDate } from '../utils/adminHelpers.js'
import CourseCard from '../components/CourseCard.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { DotsIcon, SearchIcon, ChevronIcon } from '../components/Icons.jsx'
import {
  Modal,
  Field,
  PreviewHeading,
  inputClass,
  monoLabel,
  blackButton,
  outlineButton,
  courseCategories,
} from '../components/adminUi.jsx'

const PAGE_SIZE = 6

const sortOptions = [
  { value: 'recent', label: 'Recently edited' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'lessons', label: 'Most lessons' },
]

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
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="border border-stone-300 px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.12em] text-stone-600 uppercase">
          {course.category}
        </span>
        <span className={monoLabel}>
          {course.lessons.length} Lesson{course.lessons.length === 1 ? '' : 's'}
        </span>
      </div>

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

function NewCourseCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create new course"
      className="flex min-h-56 flex-col border border-dashed border-stone-300 bg-white/60 p-6 text-left hover:border-stone-500 hover:bg-white"
    >
      <span className="flex size-9 items-center justify-center border border-stone-300 text-lg text-stone-500">
        +
      </span>
      <span className="mt-3 text-[15px] font-bold tracking-tight text-stone-900">
        New course
      </span>
      <span className={`${monoLabel} mt-auto`}>Add to catalog</span>
    </button>
  )
}

export default function AdminPage() {
  const courses = useSelector(selectCourses)
  const [showNewCourse, setShowNewCourse] = useState(false)
  const [menuFor, setMenuFor] = useState(null)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  // Any filter change returns to the first page so results stay in view.
  const resetTo = (setter) => (value) => {
    setter(value)
    setPage(1)
  }
  const onQuery = (e) => resetTo(setQuery)(e.target.value)
  const onCategory = resetTo(setCategory)
  const onSort = (e) => resetTo(setSort)(e.target.value)

  const clearFilters = () => {
    setQuery('')
    setCategory('All')
    setSort('recent')
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = courses.filter(
      (c) =>
        (category === 'All' || c.category === category) &&
        (q === '' ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)),
    )
    const sorted = [...matched]
    if (sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === 'lessons') {
      sorted.sort((a, b) => b.lessons.length - a.lessons.length)
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    }
    return sorted
  }, [courses, query, category, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )
  const hasFilters = query.trim() !== '' || category !== 'All'

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />

      <main
        className="mx-auto w-full max-w-7xl px-8 py-10"
        onClick={() => menuFor && setMenuFor(null)}
      >
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
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

        {/* Toolbar — search, category filter, sort */}
        <div className="flex flex-col gap-4 border-y border-stone-200 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2.5 border border-stone-300 bg-white px-3.5 py-2.5 text-stone-400 focus-within:border-orange-600 sm:w-72">
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={onQuery}
                placeholder="Search courses..."
                className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = c === category
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCategory(c)}
                    className={`border px-3.5 py-2 font-mono text-xs font-medium tracking-[0.1em] uppercase transition-colors ${
                      active
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-300 bg-white text-stone-600 hover:border-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={onSort}
              aria-label="Sort courses"
              className="w-full cursor-pointer appearance-none border border-stone-300 bg-white py-2.5 pr-9 pl-3.5 font-mono text-xs font-medium tracking-[0.1em] text-stone-700 uppercase outline-none hover:border-stone-400 focus:border-orange-600"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-stone-500">
              <ChevronIcon />
            </span>
          </div>
        </div>

        <p className={`${monoLabel} mt-5 mb-5`}>
          {filtered.length} Course{filtered.length === 1 ? '' : 's'}
          {hasFilters ? ' found' : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-stone-300 bg-white/50 p-10 text-center">
            <p className="text-lg font-bold text-stone-900">No courses found</p>
            <p className="mt-1.5 text-sm text-stone-500">
              Nothing matches your current search and filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className={`${outlineButton} mt-5`}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((course) => (
              <AdminCourseCard
                key={course.id}
                course={course}
                menuOpen={menuFor === course.id}
                onToggleMenu={setMenuFor}
              />
            ))}
            {/* The create affordance lives at the natural end of the list. */}
            {currentPage === pageCount && (
              <NewCourseCard onClick={() => setShowNewCourse(true)} />
            )}
          </div>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-between border-t border-stone-200 pt-6"
          >
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="flex items-center gap-1.5 px-2 py-2 font-mono text-xs font-semibold tracking-[0.1em] text-stone-700 uppercase hover:text-stone-950 disabled:cursor-default disabled:opacity-30"
            >
              <ChevronIcon direction="left" /> Prev
            </button>
            <div className="flex gap-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? 'page' : undefined}
                  className={`size-9 border font-mono text-xs font-semibold ${
                    n === currentPage
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="flex items-center gap-1.5 px-2 py-2 font-mono text-xs font-semibold tracking-[0.1em] text-stone-700 uppercase hover:text-stone-950 disabled:cursor-default disabled:opacity-30"
            >
              Next <ChevronIcon direction="right" />
            </button>
          </nav>
        )}
      </main>

      {showNewCourse && (
        <Modal title="New Course" onClose={() => setShowNewCourse(false)}>
          <AddCourseForm />
        </Modal>
      )}
    </div>
  )
}
