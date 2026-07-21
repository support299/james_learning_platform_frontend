import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { categories } from '../data/courses.js'
import { selectCourses } from '../store/coursesSlice.js'
import { setQuery, setCategory, setPage } from '../store/filtersSlice.js'
import CourseCard from '../components/CourseCard.jsx'
import { SearchIcon, ChevronIcon } from '../components/Icons.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

const PAGE_SIZE = 6

export default function CoursesPage() {
  const dispatch = useDispatch()
  const courses = useSelector(selectCourses)
  const { query, category, page } = useSelector((state) => state.filters)
  const [menuOpen, setMenuOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter(
      (c) =>
        (category === 'All' || c.category === category) &&
        (q === '' ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)),
    )
  }, [courses, query, category])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-8 pt-14 pb-12">
        <h1 className="mb-8 text-center text-4xl font-extrabold tracking-tight text-gray-900">
          Discover Course
        </h1>

        <div className="mb-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <label className="flex w-full items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-500 focus-within:border-blue-700 sm:w-85">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search courses..."
              value={query}
              onChange={(e) => dispatch(setQuery(e.target.value))}
              className="w-full bg-transparent text-gray-700 outline-none"
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4.5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {category === 'All' ? 'Categories' : category}
              <ChevronIcon direction={menuOpen ? 'up' : 'down'} />
            </button>
            {menuOpen && (
              <ul className="absolute top-full right-0 z-10 mt-1.5 min-w-40 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                {categories.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(setCategory(c))
                        setMenuOpen(false)
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        c === category
                          ? 'bg-blue-50 font-semibold text-blue-700'
                          : 'text-gray-900'
                      }`}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500">
            No courses match your search.
          </p>
        )}

        <nav
          aria-label="Pagination"
          className="mt-11 flex items-center justify-between border-t border-gray-200 pt-6"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => dispatch(setPage(currentPage - 1))}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40"
          >
            <ChevronIcon direction="left" /> Previous
          </button>
          <div className="flex gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => dispatch(setPage(n))}
                className={`size-9 rounded-lg text-sm font-medium ${
                  n === currentPage
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => dispatch(setPage(currentPage + 1))}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40"
          >
            Next <ChevronIcon direction="right" />
          </button>
        </nav>
      </main>

      <SiteFooter links={[{ label: 'Admin', to: '/admin' }]} />
    </div>
  )
}
