import { Node, mergeAttributes } from '@tiptap/core'

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share'

// A provider-agnostic, responsive video embed (YouTube, Loom, Vimeo, …).
// Stored as <div data-embed data-provider="…"><iframe src="…"></iframe></div>
// so it renders directly from the saved HTML on the student page.
export const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        // The URL lives on the inner iframe, not the wrapper.
        parseHTML: (el) => el.querySelector('iframe')?.getAttribute('src') ?? null,
        renderHTML: () => ({}),
      },
      provider: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-provider'),
        renderHTML: (attrs) =>
          attrs.provider ? { 'data-provider': attrs.provider } : {},
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-embed]' },
      // Backward compatibility with lessons authored via the YouTube extension.
      { tag: 'div[data-youtube-video]' },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-embed': '' }),
      [
        'iframe',
        {
          src: node.attrs.src,
          frameborder: '0',
          // `allow` already grants fullscreen; a separate allowfullscreen just warns.
          allow: IFRAME_ALLOW,
          referrerpolicy: 'strict-origin-when-cross-origin',
        },
      ],
    ]
  },

  addCommands() {
    return {
      setEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})
