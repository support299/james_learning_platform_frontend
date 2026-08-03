import { extractYouTubeId } from './adminHelpers.js'

// Recognize common lesson video hosts and return a responsive embed URL.
// Extend this list to support more providers.
export function toVideoEmbed(input) {
  const url = (input ?? '').trim()
  if (!url) return null

  const yt = extractYouTubeId(url)
  if (yt) {
    return {
      provider: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${yt}`,
    }
  }

  // Loom: https://www.loom.com/share/<id> (or /embed/<id>)
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/)
  if (loom) {
    return { provider: 'loom', src: `https://www.loom.com/embed/${loom[1]}` }
  }

  // Vimeo: https://vimeo.com/<id> or player.vimeo.com/video/<id>
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) {
    return { provider: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` }
  }

  return null
}

export const SUPPORTED_VIDEO_HOSTS = 'YouTube, Loom, or Vimeo'

const EMBED_ID_PATTERNS = {
  youtube: /youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/,
  loom: /loom\.com\/embed\/([\w-]+)/,
  vimeo: /vimeo\.com\/video\/(\d+)/,
}

// The inverse of toVideoEmbed: given a provider (read off an embed's
// data-provider attribute) and its iframe src, recover the id that
// identifies this specific video for progress tracking. Mirrors
// backend/courses/embeds.py so both sides agree on the same id.
// Lessons don't reliably carry `type: 'video'` — the editor always saves
// `type: 'text'` regardless of content (see LessonEditorPage.jsx). Whether a
// lesson has anything to track is a property of its html, not its type.
export function hasVideoEmbed(html) {
  return typeof html === 'string' && html.includes('data-embed')
}

export function extractEmbedId(provider, src) {
  const pattern = EMBED_ID_PATTERNS[provider]
  if (!pattern || !src) return null
  const match = src.match(pattern)
  return match ? match[1] : null
}
