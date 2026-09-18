import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageLessonViewer from '../../components/ImageLessonViewer.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockGetMyCompletions = vi.fn()
vi.mock('../../store/coursesApi.js', () => ({
  useGetMyCompletionsQuery: () => mockGetMyCompletions(),
}))

const course = {
  id: 'c1',
  lastVisitedLesson: null,
  lessons: [
    { id: 'a', title: 'A' },
    { id: 'b', title: 'B' },
    { id: 'c', title: 'C' },
  ],
}

const lesson = {
  id: 'a',
  title: 'Map',
  image: 'https://example.com/map.png',
  hotspots: [
    { x: 0.1, y: 0.1, w: 0.2, h: 0.2, target: 'b' },
    { x: 0.5, y: 0.5, w: 0.2, h: 0.2, target: 'c' },
  ],
}

beforeEach(() => {
  mockNavigate.mockClear()
})

describe('ImageLessonViewer hotspot gating', () => {
  test('an unlocked target hotspot navigates', () => {
    // 'b' is unlocked once its only earlier lesson, 'a', is completed.
    mockGetMyCompletions.mockReturnValue({ data: { c1: { a: true } } })
    render(<ImageLessonViewer lesson={lesson} courseId="c1" course={course} />)
    screen.getAllByLabelText('Jump to lesson')[0].click()
    expect(mockNavigate).toHaveBeenCalledWith('/course/c1/lesson/b')
  })

  test('a locked (leapfrog) target hotspot does not navigate', () => {
    mockGetMyCompletions.mockReturnValue({ data: {} })
    render(<ImageLessonViewer lesson={lesson} courseId="c1" course={course} />)
    // Hotspot to 'c' requires 'a' and 'b' both completed first.
    const hotspots = screen.getAllByLabelText('Jump to lesson')
    hotspots[1].click()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(hotspots[1]).toHaveAttribute('aria-disabled', 'true')
  })

  test('a leapfrog hotspot works once every lesson in between is completed', () => {
    mockGetMyCompletions.mockReturnValue({ data: { c1: { a: true, b: true } } })
    render(<ImageLessonViewer lesson={lesson} courseId="c1" course={course} />)
    screen.getAllByLabelText('Jump to lesson')[1].click()
    expect(mockNavigate).toHaveBeenCalledWith('/course/c1/lesson/c')
  })
})
