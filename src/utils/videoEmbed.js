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
