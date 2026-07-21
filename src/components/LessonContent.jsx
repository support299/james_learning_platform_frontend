import { QuizIcon } from './Icons.jsx'

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

export default function LessonContent({ lesson }) {
  if (lesson.type === 'video') {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    )
  }

  if (lesson.type === 'text') {
    return (
      <article className="rounded-xl border border-gray-200 bg-white p-8">
        {lesson.html != null ? (
          // Rich text authored with Tiptap, stored as HTML. Authored by admins
          // and constrained to the editor's schema, so rendering it is safe.
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
