import { useEffect, useRef, useState } from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { Embed } from './EmbedNode.js'
import { toVideoEmbed, SUPPORTED_VIDEO_HOSTS } from '../utils/videoEmbed.js'
import { ChevronIcon } from './Icons.jsx'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeIcon,
  HighlightIcon,
  CodeIcon,
  LinkIcon,
  BulletListIcon,
  OrderedListIcon,
  QuoteIcon,
  DividerIcon,
  VideoIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  UndoIcon,
  RedoIcon,
} from './EditorIcons.jsx'

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6]
const TEXT_COLORS = [
  '#111827', '#ef4444', '#f97316', '#eab308', '#16a34a',
  '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#78716c',
]

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor selection while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-semibold transition-colors ${
        active
          ? 'bg-orange-100 text-orange-700'
          : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
      } disabled:opacity-30 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  )
}

const Divider = () => <span className="mx-1 h-6 w-px shrink-0 bg-stone-200" />

function Popover({ title, active, trigger, panelClass = '', children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold transition-colors ${
          active
            ? 'bg-orange-100 text-orange-700'
            : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
        }`}
      >
        {trigger}
        <ChevronIcon size={12} />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full left-0 z-40 mt-1 rounded-lg border border-stone-200 bg-white p-1 shadow-lg ${panelClass}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, active, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left transition-colors ${
        active
          ? 'bg-orange-50 text-orange-700'
          : 'text-stone-700 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    // Link/underline/code are bundled in StarterKit v3 — don't add them again.
    extensions: [
      StarterKit.configure({
        heading: { levels: HEADING_LEVELS },
        link: { openOnClick: false, autolink: true },
      }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Embed,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // A lone empty paragraph means "no content"; a video-only lesson isn't.
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'lesson-html min-h-[420px] px-6 py-5 focus:outline-none',
      },
    },
  })

  // Sync external content changes (loading a lesson to edit, or a reset)
  // without disturbing in-progress typing.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (editor.getHTML() === (value || '')) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  // Derive every button's active state reactively so the toolbar stays in sync
  // with the cursor/selection (re-renders only when a tracked value changes).
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
      isUnderline: editor.isActive('underline'),
      isStrike: editor.isActive('strike'),
      isHighlight: editor.isActive('highlight'),
      isCode: editor.isActive('code'),
      isLink: editor.isActive('link'),
      isBulletList: editor.isActive('bulletList'),
      isOrderedList: editor.isActive('orderedList'),
      isBlockquote: editor.isActive('blockquote'),
      isAlignLeft: editor.isActive({ textAlign: 'left' }),
      isAlignCenter: editor.isActive({ textAlign: 'center' }),
      isAlignRight: editor.isActive({ textAlign: 'right' }),
      activeHeading: HEADING_LEVELS.find((l) =>
        editor.isActive('heading', { level: l }),
      ),
      color: editor.getAttributes('textStyle').color || null,
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  })

  if (!editor || !state) return null

  const chain = () => editor.chain().focus()
  const { activeHeading, color: currentColor } = state

  const addVideo = () => {
    const url = window.prompt(`Paste a ${SUPPORTED_VIDEO_HOSTS} link`)
    if (!url) return
    const embed = toVideoEmbed(url)
    if (!embed) {
      window.alert(`That link isn't a recognized ${SUPPORTED_VIDEO_HOSTS} URL.`)
      return
    }
    chain().setEmbed(embed).run()
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Link URL (leave empty to remove)', prev)
    if (url === null) return
    if (url === '') {
      chain().extendMarkRange('link').unsetLink().run()
      return
    }
    chain().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="rounded-xl border border-stone-300 bg-white shadow-sm">
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-stone-200 bg-stone-50/95 px-2 py-1.5 backdrop-blur">
        <Popover
          title="Text style"
          active={Boolean(activeHeading)}
          panelClass="w-48"
          trigger={<span>{activeHeading ? `Heading ${activeHeading}` : 'Paragraph'}</span>}
        >
          {(close) => (
            <>
              <MenuItem
                active={!activeHeading}
                onClick={() => {
                  chain().setParagraph().run()
                  close()
                }}
              >
                Paragraph
              </MenuItem>
              {HEADING_LEVELS.map((level) => (
                <MenuItem
                  key={level}
                  active={activeHeading === level}
                  onClick={() => {
                    chain().setHeading({ level }).run()
                    close()
                  }}
                >
                  <span
                    className="font-bold text-stone-900"
                    style={{ fontSize: `${1.4 - (level - 1) * 0.1}rem` }}
                  >
                    Heading {level}
                  </span>
                </MenuItem>
              ))}
            </>
          )}
        </Popover>

        <Popover
          title="Text color"
          active={Boolean(currentColor)}
          panelClass="w-56"
          trigger={
            <span className="flex flex-col items-center leading-none">
              <span className="text-[15px] font-bold">A</span>
              <span
                className="mt-0.5 h-1 w-4 rounded-full"
                style={{ background: currentColor || '#111827' }}
              />
            </span>
          }
        >
          {(close) => (
            <div>
              <div className="grid grid-cols-5 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={`Set text color ${c}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      chain().setColor(c).run()
                      close()
                    }}
                    className={`size-8 rounded-md border transition-transform hover:scale-110 ${
                      currentColor === c
                        ? 'border-stone-900'
                        : 'border-stone-200'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-100 pt-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-stone-600">
                  <input
                    type="color"
                    value={currentColor || '#111827'}
                    onChange={(e) => chain().setColor(e.target.value).run()}
                    className="size-6 cursor-pointer rounded border border-stone-200 bg-transparent p-0"
                  />
                  Custom
                </label>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    chain().unsetColor().run()
                    close()
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Default
                </button>
              </div>
            </div>
          )}
        </Popover>
        <Divider />

        <Btn title="Bold" active={state.isBold} onClick={() => chain().toggleBold().run()}>
          <BoldIcon />
        </Btn>
        <Btn title="Italic" active={state.isItalic} onClick={() => chain().toggleItalic().run()}>
          <ItalicIcon />
        </Btn>
        <Btn title="Underline" active={state.isUnderline} onClick={() => chain().toggleUnderline().run()}>
          <UnderlineIcon />
        </Btn>
        <Btn title="Strikethrough" active={state.isStrike} onClick={() => chain().toggleStrike().run()}>
          <StrikeIcon />
        </Btn>
        <Btn title="Highlight" active={state.isHighlight} onClick={() => chain().toggleHighlight().run()}>
          <HighlightIcon />
        </Btn>
        <Btn title="Inline code" active={state.isCode} onClick={() => chain().toggleCode().run()}>
          <CodeIcon />
        </Btn>
        <Btn title="Link" active={state.isLink} onClick={setLink}>
          <LinkIcon />
        </Btn>
        <Divider />
        <Btn title="Bullet list" active={state.isBulletList} onClick={() => chain().toggleBulletList().run()}>
          <BulletListIcon />
        </Btn>
        <Btn title="Numbered list" active={state.isOrderedList} onClick={() => chain().toggleOrderedList().run()}>
          <OrderedListIcon />
        </Btn>
        <Btn title="Quote" active={state.isBlockquote} onClick={() => chain().toggleBlockquote().run()}>
          <QuoteIcon />
        </Btn>
        <Divider />
        <Btn title="Align left" active={state.isAlignLeft} onClick={() => chain().setTextAlign('left').run()}>
          <AlignLeftIcon />
        </Btn>
        <Btn title="Align center" active={state.isAlignCenter} onClick={() => chain().setTextAlign('center').run()}>
          <AlignCenterIcon />
        </Btn>
        <Btn title="Align right" active={state.isAlignRight} onClick={() => chain().setTextAlign('right').run()}>
          <AlignRightIcon />
        </Btn>
        <Divider />
        <Btn title="Embed video" onClick={addVideo}>
          <VideoIcon />
        </Btn>
        <Btn title="Divider" onClick={() => chain().setHorizontalRule().run()}>
          <DividerIcon />
        </Btn>
        <Divider />
        <Btn title="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <UndoIcon />
        </Btn>
        <Btn title="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <RedoIcon />
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
