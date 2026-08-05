import { useEffect, useState } from 'react'
import { CheckCircleIcon, QuizIcon } from './Icons.jsx'
import VideoProgressTracker from './VideoProgressTracker.jsx'
import { hasVideoEmbed } from '../utils/videoEmbed.js'
import { useSetLessonCompleteMutation } from '../store/coursesApi.js'

function TextBlock({ block }) {
  if (block.type === 'h2') {
    return (
      <h2 className="mt-6 mb-2 text-xl font-bold text-gray-900">{block.text}</h2>
    )
  }
  if (block.type === 'h3') {
    return (
      <h3 className="mt-4 mb-1.5 text-lg font-semibold text-gray-800">
        {block.text}
      </h3>
    )
  }
  if (block.type === 'ul') {
    return (
      <ul className="list-disc space-y-1.5 pl-6 text-gray-700">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="text-gray-700">{block.text}</p>
}

function LessonBody({ lesson }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-8">
      {lesson.html != null ? (
        // Rich text authored with Tiptap, stored as HTML. Authored by admins
        // and constrained to the editor's schema, so rendering it is safe.
        // Video-type lessons carry their embed(s) inline here too — there is
        // no separate video field, see EmbedNode.js.
        <div
          className="lesson-html"
          dangerouslySetInnerHTML={{ __html: lesson.html }}
        />
      ) : (
        <div className="space-y-4">
          {lesson.body.map((block, i) => (
            <TextBlock key={i} block={block} />
          ))}
        </div>
      )}
    </article>
  )
}

// The student-facing API sends options as {id, text} (order shuffled per
// fetch, no correct-answer marker — grading happens server-side). Staff
// previewing their own quiz still get the editor's shape (plain strings +
// an `answer` index) from the same endpoint, so fall back to the option's
// position as its id there.
function normalizeOption(option, index) {
  return typeof option === 'string' ? { id: index, text: option } : option
}

function QuizQuestion({ question, questionId, selected, onSelect }) {
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="mb-4 font-semibold text-gray-900">{question.prompt}</p>
      <ul className="space-y-2">
        {question.options.map((rawOption, optionIndex) => {
          const option = normalizeOption(rawOption, optionIndex)
          return (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name={`quiz-question-${questionId}`}
                  checked={selected === option.id}
                  onChange={() => onSelect(questionId, option.id)}
                  className="size-4 accent-blue-700"
                />
                {option.text}
              </label>
            </li>
          )
        })}
      </ul>
    </li>
  )
}

function QuizPlayer({ lesson, courseId, isCompleted }) {
  const questions = lesson.questions ?? []
  const [answers, setAnswers] = useState({})
  const [setLessonComplete, { isLoading: isSubmitting, error: submitError }] =
    useSetLessonCompleteMutation()

  // A wrong submission refetches the lesson (see coursesApi.js), which
  // serves a freshly shuffled question/option order — the old selections no
  // longer line up with anything meaningful, so drop them.
  useEffect(() => setAnswers({}), [lesson.id, lesson.questions])

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
        <span className="text-blue-700">
          <QuizIcon size={40} />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <p className="text-gray-500">This quiz doesn't have any questions yet.</p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
        <span className="text-green-700">
          <CheckCircleIcon size={40} />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <p className="text-gray-500">
          You've passed this quiz — nice work.
        </p>
      </div>
    )
  }

  const allAnswered = questions.every((q, i) => answers[q.id ?? i] !== undefined)

  const handleSubmit = () => {
    setLessonComplete({
      courseId,
      lessonId: lesson.id,
      completed: true,
      answers,
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <span className="text-sm font-medium text-gray-500">
          {Object.keys(answers).length} of {questions.length} answered
        </span>
      </div>
      <ul className="space-y-4">
        {questions.map((question, index) => {
          const questionId = question.id ?? index
          return (
            <QuizQuestion
              key={questionId}
              question={question}
              questionId={questionId}
              selected={answers[questionId]}
              onSelect={(qId, optId) =>
                setAnswers((prev) => ({ ...prev, [qId]: optId }))
              }
            />
          )
        })}
      </ul>

      <div className="mt-6 flex flex-col items-start gap-2">
        {submitError?.data?.detail && (
          <p className="text-sm text-red-600">
            {[].concat(submitError.data.detail).join(' ')}
          </p>
        )}
        <button
          type="button"
          disabled={!allAnswered || isSubmitting}
          onClick={handleSubmit}
          className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-default disabled:opacity-40"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Quiz'}
        </button>
        <p className="text-xs text-gray-500">
          All questions must be correct to pass — you can try again if some
          are wrong.
        </p>
      </div>
    </div>
  )
}

export default function LessonContent({ lesson, courseId, isCompleted }) {
  if (lesson.type === 'quiz') {
    return (
      <QuizPlayer lesson={lesson} courseId={courseId} isCompleted={isCompleted} />
    )
  }

  // Whether a lesson has anything to track is a property of its html (does
  // it contain a video embed?), not its `type` — the editor always saves
  // `type: 'text'` regardless of content, so `type: 'video'` only ever
  // appears in legacy mock data, never in admin-authored lessons.
  if (hasVideoEmbed(lesson.html)) {
    return (
      <VideoProgressTracker courseId={courseId} lessonId={lesson.id}>
        <LessonBody lesson={lesson} />
      </VideoProgressTracker>
    )
  }

  return <LessonBody lesson={lesson} />
}
