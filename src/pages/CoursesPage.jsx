import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useGetCoursesQuery,
  useGetMyCompletionsQuery,
} from '../store/coursesApi.js'
import { isCourseComplete } from '../utils/progress.js'
import { setQuery, setPage } from '../store/filtersSlice.js'
import CourseCard from '../components/CourseCard.jsx'
import { SearchIcon, ChevronIcon } from '../components/Icons.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

const PAGE_SIZE = 6

export default function CoursesPage() {
  const dispatch = useDispatch()
  const { data: courses = [], isLoading, isError, refetch } =
    useGetCoursesQuery()
  const { data: completions = {} } = useGetMyCompletionsQuery()
  const { query, page } = useSelector((state) => state.filters)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = courses.filter(
      (c) =>
        q === '' ||
        c.title.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q),
    )
    // Finished courses sink to the bottom. Sort is stable, so everything
    // within each group keeps the API's ordering (most recently updated first).
    return [...matches].sort(
      (a, b) =>
        Number(isCourseComplete(completions, a)) -
        Number(isCourseComplete(completions, b)),
    )
  }, [courses, query, completions])

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

        <div className="mb-12 flex justify-center">
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
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-gray-500">Loading courses…</p>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="font-semibold text-gray-900">Couldn’t reach the API</p>
            <p className="mt-1 text-sm text-gray-500">
              Make sure the Django server is running on port 8000.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500">
            {query.trim()
              ? 'No courses match your search.'
              : 'No courses yet. Create one from the Admin page.'}
          </p>
        )}

        {pageCount > 1 && (
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
        )}
      </main>

      <SiteFooter links={[{ label: 'Admin', to: '/admin' }]} />
    </div>
  )
}
