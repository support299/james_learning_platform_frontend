import { QuizIcon } from './Icons.jsx'
import VideoProgressTracker from './VideoProgressTracker.jsx'
import { hasVideoEmbed } from '../utils/videoEmbed.js'

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

export default function LessonContent({ lesson, courseId }) {
  if (lesson.type === 'quiz') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
        <span className="text-blue-700">
          <QuizIcon size={40} />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <p className="text-gray-500">
          {lesson.questionCount} questions • Test what you learned in this module.
        </p>
        <button
          type="button"
          className="mt-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Start Quiz
        </button>
        <span className="text-xs text-gray-400">
          Quizzes are not available in this prototype.
        </span>
      </div>
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
