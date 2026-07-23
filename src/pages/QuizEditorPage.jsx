import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectCourseById,
  addLesson,
  updateLesson,
} from '../store/coursesSlice.js'
import { slugify, uniqueSlug } from '../utils/adminHelpers.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { Field, inputClass, monoLabel } from '../components/adminUi.jsx'
import { ArrowIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx'

const MAX_OPTIONS = 6

// Local keys keep React's list identity stable while questions are reordered
// or removed; they are stripped before the quiz is saved to the store.
let seq = 0
const blankQuestion = () => ({
  key: `q${++seq}`,
  prompt: '',
  options: ['', ''],
  answer: 0,
})

function seedQuestions(lesson) {
  if (!lesson?.questions?.length) return [blankQuestion()]
  return lesson.questions.map((q) => ({
    key: `q${++seq}`,
    prompt: q.prompt ?? '',
    options: q.options?.length ? [...q.options] : ['', ''],
    answer: q.answer ?? 0,
  }))
}

function isComplete(question) {
  const filled = question.options.filter((o) => o.trim() !== '')
  return (
    question.prompt.trim() !== '' &&
    filled.length >= 2 &&
    question.options[question.answer]?.trim() !== ''
  )
}

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

function QuestionCard({ question, index, total, onChange, onRemove }) {
  const setOption = (optionIndex, value) => {
    const options = question.options.map((o, i) =>
      i === optionIndex ? value : o,
    )
    onChange({ ...question, options })
  }

  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) return
    onChange({ ...question, options: [...question.options, ''] })
  }

  const removeOption = (optionIndex) => {
    if (question.options.length <= 2) return
    const options = question.options.filter((_, i) => i !== optionIndex)
    // Keep the correct answer pointing at the same option after the shift.
    let answer = question.answer
    if (optionIndex === answer) answer = 0
    else if (optionIndex < answer) answer -= 1
    onChange({ ...question, options, answer })
  }

  return (
    <li className="border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className={monoLabel}>Question {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={total === 1}
          aria-label={`Delete question ${index + 1}`}
          className="flex size-8 items-center justify-center text-stone-400 hover:text-red-600 disabled:opacity-25 disabled:hover:text-stone-400"
        >
          <TrashIcon size={16} />
        </button>
      </div>

      <input
        type="text"
        value={question.prompt}
        onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        placeholder="What do you want to ask?"
        className={inputClass}
      />

      <span className={`${monoLabel} mt-5 mb-2 block`}>
        Answers — select the correct one
      </span>
      <ul className="space-y-2">
        {question.options.map((option, optionIndex) => (
          <li key={optionIndex} className="flex items-center gap-3">
            <input
              type="radio"
              name={`${question.key}-answer`}
              checked={question.answer === optionIndex}
              onChange={() => onChange({ ...question, answer: optionIndex })}
              aria-label={`Mark answer ${optionIndex + 1} correct`}
              className="size-4 shrink-0 accent-orange-600"
            />
            <input
              type="text"
              value={option}
              onChange={(e) => setOption(optionIndex, e.target.value)}
              placeholder={`Answer ${optionIndex + 1}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeOption(optionIndex)}
              disabled={question.options.length <= 2}
              aria-label={`Remove answer ${optionIndex + 1}`}
              className="flex size-8 shrink-0 items-center justify-center text-stone-400 hover:text-red-600 disabled:opacity-25 disabled:hover:text-stone-400"
            >
              <TrashIcon size={15} />
            </button>
          </li>
        ))}
      </ul>

      {question.options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-orange-600"
        >
          <PlusIcon size={14} /> Add answer
        </button>
      )}
    </li>
  )
}

function QuizEditor({ course, lesson }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isEdit = Boolean(lesson)
  const backTo = `/admin/course/${course.id}`

  const [title, setTitle] = useState(lesson?.title ?? '')
  const [overview, setOverview] = useState(lesson?.overview ?? '')
  const [questions, setQuestions] = useState(() => seedQuestions(lesson))

  const canSave = title.trim() !== '' && questions.every(isComplete)

  const updateQuestion = (index, next) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? next : q)))

  const save = () => {
    if (!canSave) return
    const cleaned = questions.map(({ prompt, options, answer }) => {
      const kept = options.filter((o) => o.trim() !== '')
      return {
        prompt: prompt.trim(),
        // Re-map the answer index onto the trimmed option list.
        answer: kept.indexOf(options[answer]),
        options: kept.map((o) => o.trim()),
      }
    })
    const data = {
      title: title.trim(),
      type: 'quiz',
      questions: cleaned,
      questionCount: cleaned.length,
      meta: `${cleaned.length} Question${cleaned.length === 1 ? '' : 's'}`,
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
                {isEdit ? 'Edit quiz' : 'New quiz'}
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
              {isEdit ? 'Save changes' : 'Create quiz'}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz title"
          className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none"
          autoFocus
        />

        <div className="mt-6">
          <Field label="Overview (optional)">
            <input
              type="text"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="A one-line summary for the quiz's Overview tab."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-8 mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            Questions{' '}
            <span className="font-mono text-sm font-normal text-stone-400">
              ({questions.length})
            </span>
          </h2>
        </div>

        <ul className="space-y-3">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.key}
              question={question}
              index={index}
              total={questions.length}
              onChange={(next) => updateQuestion(index, next)}
              onRemove={() =>
                setQuestions((qs) => qs.filter((_, i) => i !== index))
              }
            />
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-stone-300 bg-white/60 px-6 py-5 text-sm font-semibold text-stone-700 hover:border-stone-400"
        >
          <PlusIcon size={15} /> Add question
        </button>

        <p className="mt-3 text-xs text-stone-500">
          Every question needs a prompt, at least two answers, and one marked
          correct. Blank answers are dropped when you save.
        </p>
      </main>
    </div>
  )
}

export default function QuizEditorPage() {
  const { courseId, lessonId } = useParams()
  const course = useSelector((state) => selectCourseById(state, courseId))

  if (!course) return <NotFound>Course not found</NotFound>

  const lesson = lessonId ? course.lessons.find((l) => l.id === lessonId) : null
  if (lessonId && !lesson) return <NotFound>Quiz not found</NotFound>

  return <QuizEditor key={lessonId ?? 'new'} course={course} lesson={lesson} />
}
