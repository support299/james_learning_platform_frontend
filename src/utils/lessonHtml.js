// Converts any lesson shape into editor-ready HTML so existing lessons —
// rich-text, legacy block bodies, or old video lessons — can all be edited.

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function blockToHtml(block) {
  if (block.type === 'h2') return `<h2>${esc(block.text)}</h2>`
  if (block.type === 'h3') return `<h3>${esc(block.text)}</h3>`
  if (block.type === 'ul') {
    return `<ul>${block.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
  }
  return `<p>${esc(block.text)}</p>`
}

export function lessonToHtml(lesson) {
  if (!lesson) return ''
  if (lesson.html != null) return lesson.html
  if (lesson.type === 'video' && lesson.youtubeId) {
    return `<div data-embed data-provider="youtube"><iframe src="https://www.youtube-nocookie.com/embed/${lesson.youtubeId}"></iframe></div>`
  }
  if (Array.isArray(lesson.body)) return lesson.body.map(blockToHtml).join('')
  return ''
}
