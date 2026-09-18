import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LessonSidebar from '../../components/LessonSidebar.jsx'

const mockGetMyCompletions = vi.fn()
vi.mock('../../store/coursesApi.js', () => ({
  useGetMyCompletionsQuery: () => mockGetMyCompletions(),
}))

const course = {
  id: 'c1',
  title: 'Course',
  lastVisitedLesson: 'b',
  lessons: [
    { id: 'a', title: 'A', type: 'text' },
    { id: 'b', title: 'B', type: 'text' },
    { id: 'c', title: 'C', type: 'text' },
  ],
}

function renderSidebar(completions, activeLessonId = 'a') {
  mockGetMyCompletions.mockReturnValue({ data: completions })
  return render(
    <MemoryRouter>
      <LessonSidebar course={course} activeLessonId={activeLessonId} />
    </MemoryRouter>,
  )
}

describe('LessonSidebar gating', () => {
  test('a completed lesson is a link', () => {
    renderSidebar({ c1: { a: true } })
    expect(screen.getByText('1. A').closest('a')).toHaveAttribute(
      'href',
      '/course/c1/lesson/a',
    )
  })

  test('the persisted last-visited (not yet completed) lesson is still a link', () => {
    renderSidebar({ c1: { a: true } })
    expect(screen.getByText('2. B').closest('a')).toHaveAttribute(
      'href',
      '/course/c1/lesson/b',
    )
  })

  test('a lesson that is neither completed nor last-visited is not a link', () => {
    renderSidebar({ c1: { a: true } })
    expect(screen.getByText('3. C').closest('a')).toBeNull()
    expect(screen.getByText('Complete earlier lessons to unlock')).toBeInTheDocument()
  })

  test('the active lesson is always a link, even before the server-side visit lands', () => {
    // course.lastVisitedLesson still says 'b' (stale), but we're actively
    // viewing 'c' right now via app navigation.
    renderSidebar({ c1: { a: true } }, 'c')
    expect(screen.getByText('3. C').closest('a')).toHaveAttribute(
      'href',
      '/course/c1/lesson/c',
    )
  })
})
