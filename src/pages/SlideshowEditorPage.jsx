import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useGetCourseQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useUploadSlideshowSlideMutation,
  useReplaceSlideshowSlideImageMutation,
  useDeleteSlideshowSlideMutation,
  useImportSlideshowPptxMutation,
} from '../store/coursesApi.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { ConfirmModal, Field, inputClass, blackButton, outlineButton, monoLabel } from '../components/adminUi.jsx'
import { ArrowIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx'

// A drag smaller than this (in slide-fraction units) is treated as an
// accidental click rather than an intentional hotspot rectangle.
const DRAG_THRESHOLD = 0.01

function Notice({ children }) {
  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">{children}</h1>
        <Link to="/admin" className="mt-4 inline-block text-sm font-semibold text-orange-600 underline">
          Back to courses
        </Link>
      </main>
    </div>
  )
}

function EditorHeader({ course, title, isEdit, backTo, onCancel, onSave, saving, canSave, error }) {
  return (
    <div className="sticky top-0 z-30 h-16 border-b border-stone-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={backTo}
            aria-label={`Back to ${course.title}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
          >
            <ArrowIcon direction="left" size={16} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-stone-400">{course.title}</p>
            <h1 className="truncate text-base font-bold tracking-tight text-stone-900">{title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {error && <span className="hidden text-sm font-medium text-red-600 sm:inline">{error}</span>}
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="rounded-lg bg-stone-950 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-default disabled:opacity-40"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create slideshow'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- New slideshow: title/overview only. Slide authoring needs a lesson id
// to attach slides to, so it unlocks only once this has been saved. -------
function NewSlideshowForm({ course }) {
  const navigate = useNavigate()
  const backTo = `/admin/course/${course.id}`
  const [title, setTitle] = useState('')
  const [overview, setOverview] = useState('')
  const [createLesson, { isLoading: saving }] = useCreateLessonMutation()
  const [error, setError] = useState(null)

  const canSave = title.trim() !== '' && !saving

  const save = async () => {
    if (!canSave) return
    setError(null)
    try {
      const created = await createLesson({
        courseId: course.id,
        lesson: { title: title.trim(), type: 'slideshow', overview: overview.trim() },
      }).unwrap()
      navigate(`/admin/course/${course.id}/slideshow/${created.id}/edit`)
    } catch {
      setError('Could not create the slideshow. Is the API running?')
    }
  }

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <EditorHeader
        course={course}
        title="New slideshow"
        isEdit={false}
        backTo={backTo}
        onCancel={() => navigate(backTo)}
        onSave={save}
        saving={saving}
        canSave={canSave}
        error={error}
      />
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slideshow title"
          className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none"
          autoFocus
        />
        <div className="mt-6">
          <Field label="Overview (optional)">
            <input
              type="text"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="A one-line summary for the Overview tab."
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-6 text-sm text-stone-500">
          Save the slideshow first — then you can add slides or import a .pptx.
        </p>
      </main>
    </div>
  )
}

// --- Slide editing (existing lesson) --------------------------------------

function SlideThumb({ slide, index, isActive, onSelect, onDelete }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-2 border px-2 py-2 text-left ${
          isActive ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white hover:border-stone-400'
        }`}
      >
        <img src={slide.image} alt="" className="size-12 shrink-0 rounded object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-stone-900">Slide {index + 1}</span>
          <span className="block text-xs text-stone-500">
            {slide.hotspots.length} hotspot{slide.hotspots.length === 1 ? '' : 's'}
            {!slide.isRequired && ' · optional'}
          </span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={`Delete slide ${index + 1}`}
          className="flex size-7 shrink-0 items-center justify-center text-stone-400 hover:text-red-600"
        >
          <TrashIcon size={14} />
        </span>
      </button>
    </li>
  )
}

function HotspotBox({ hotspot, index, isSelected, targetLabel, onSelect }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(index)
      }}
      title={targetLabel}
      className={`absolute cursor-pointer rounded border-2 ${
        isSelected ? 'border-orange-600 bg-orange-500/20' : 'border-blue-500/70 bg-blue-500/10 hover:border-blue-600'
      }`}
      style={{
        left: `${hotspot.x * 100}%`,
        top: `${hotspot.y * 100}%`,
        width: `${hotspot.w * 100}%`,
        height: `${hotspot.h * 100}%`,
      }}
    />
  )
}

function SlideCanvas({ slide, otherSlides, onAddHotspot, onRetarget, onDeleteHotspot }) {
  const containerRef = useRef(null)
  const [draft, setDraft] = useState(null) // {x, y, w, h} while dragging or just finished
  // Plain state, not a ref: whether a drag is currently active gates the
  // target-picker panel below, and that decision needs to happen in the
  // same render pass as the draft rect itself — batching two setState calls
  // in one handler guarantees that; a ref mutation read back during render
  // doesn't carry the same guarantee once capture/release timing is involved.
  const [dragging, setDragging] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const fractionsFromEvent = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1),
    }
  }

  // Pointer capture (rather than plain mouse events) keeps move/up events
  // arriving at this element even once the cursor leaves it mid-drag — a
  // fast or edge-hugging drag otherwise loses the terminating mouseup to
  // whatever element ends up under the cursor, silently stranding the drag
  // forever (nothing renders, since the drag never "finishes").
  const originRef = useRef(null)

  const onPointerDown = (e) => {
    setSelectedIndex(null)
    e.currentTarget.setPointerCapture(e.pointerId)
    const point = fractionsFromEvent(e)
    originRef.current = point
    setDragging(true)
    setDraft({ x: point.x, y: point.y, w: 0, h: 0 })
  }

  const onPointerMove = (e) => {
    if (!originRef.current) return
    const point = fractionsFromEvent(e)
    const x = Math.min(originRef.current.x, point.x)
    const y = Math.min(originRef.current.y, point.y)
    const w = Math.abs(point.x - originRef.current.x)
    const h = Math.abs(point.y - originRef.current.y)
    setDraft({ x, y, w, h })
  }

  const onPointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    originRef.current = null
    setDragging(false)
    setDraft((current) => {
      if (current && current.w >= DRAG_THRESHOLD && current.h >= DRAG_THRESHOLD) {
        return current // keep as a pending draft awaiting a target
      }
      return null // too small — treat as an accidental click
    })
  }

  const targetLabelFor = (targetId) => {
    const i = otherSlides.findIndex((s) => s.id === targetId)
    return i >= 0 ? `Slide ${i + 1}` : 'Unknown slide'
  }

  return (
    <div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full touch-none cursor-crosshair overflow-hidden rounded-lg border border-stone-300 bg-stone-100 select-none"
      >
        <img src={slide.image} alt="" className="pointer-events-none block w-full" draggable={false} />
        {slide.hotspots.map((h, i) => (
          <HotspotBox
            key={i}
            hotspot={h}
            index={i}
            isSelected={selectedIndex === i}
            targetLabel={targetLabelFor(h.target)}
            onSelect={setSelectedIndex}
          />
        ))}
        {draft && (
          <div
            className="pointer-events-none absolute rounded border-2 border-dashed border-orange-600 bg-orange-500/10"
            style={{
              left: `${draft.x * 100}%`,
              top: `${draft.y * 100}%`,
              width: `${draft.w * 100}%`,
              height: `${draft.h * 100}%`,
            }}
          />
        )}
      </div>

      {draft && !dragging && (
        <div className="mt-3 flex items-center gap-3 border border-orange-300 bg-orange-50 px-4 py-3">
          <span className="text-sm font-semibold text-stone-800">New hotspot — jumps to:</span>
          <select
            className={`${inputClass} w-auto`}
            defaultValue=""
            onChange={(e) => {
              const targetId = Number(e.target.value)
              if (!targetId) return
              onAddHotspot({ ...draft, target: targetId })
              setDraft(null)
            }}
          >
            <option value="" disabled>
              Choose a slide…
            </option>
            {otherSlides.map((s, i) => (
              <option key={s.id} value={s.id}>
                Slide {i + 1}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setDraft(null)} className="text-sm font-medium text-stone-500 hover:text-stone-800">
            Cancel
          </button>
        </div>
      )}

      {selectedIndex !== null && slide.hotspots[selectedIndex] && (
        <div className="mt-3 flex items-center gap-3 border border-stone-300 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-stone-800">Hotspot — jumps to:</span>
          <select
            className={`${inputClass} w-auto`}
            value={slide.hotspots[selectedIndex].target ?? ''}
            onChange={(e) => onRetarget(selectedIndex, Number(e.target.value))}
          >
            {otherSlides.map((s, i) => (
              <option key={s.id} value={s.id}>
                Slide {i + 1}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              onDeleteHotspot(selectedIndex)
              setSelectedIndex(null)
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800"
          >
            <TrashIcon size={14} /> Delete hotspot
          </button>
          <button type="button" onClick={() => setSelectedIndex(null)} className="text-sm font-medium text-stone-500 hover:text-stone-800">
            Close
          </button>
        </div>
      )}
    </div>
  )
}

function SlideshowEditor({ course, lesson }) {
  const navigate = useNavigate()
  const backTo = `/admin/course/${course.id}`
  const [updateLesson, { isLoading: updating }] = useUpdateLessonMutation()
  const [uploadSlide, { isLoading: uploading }] = useUploadSlideshowSlideMutation()
  const [replaceImage, { isLoading: replacing }] = useReplaceSlideshowSlideImageMutation()
  const [deleteSlide] = useDeleteSlideshowSlideMutation()
  const [importPptx, { isLoading: importing }] = useImportSlideshowPptxMutation()

  const [title, setTitle] = useState(lesson.title)
  const [overview, setOverview] = useState(lesson.overview ?? '')
  const [slides, setSlides] = useState(lesson.slides)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmReimport, setConfirmReimport] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState(null)

  const addSlideInputRef = useRef(null)
  const replaceImageInputRef = useRef(null)
  const importInputRef = useRef(null)
  const prevImportStatus = useRef(lesson.importStatus)

  const isPending = lesson.importStatus === 'pending'
  const { data: polled } = useGetLessonQuery(
    { courseId: course.id, lessonId: lesson.id },
    { pollingInterval: isPending ? 2000 : 0, skip: !isPending },
  )

  // Re-seed local slides only when an import just finished — never clobber
  // in-progress manual edits otherwise.
  useEffect(() => {
    const latest = polled ?? lesson
    if (prevImportStatus.current === 'pending' && latest.importStatus === 'done') {
      setSlides(latest.slides)
      setCurrentIndex(0)
    }
    if (latest.importStatus === 'failed' && prevImportStatus.current === 'pending') {
      setError(latest.importError || 'Import failed.')
    }
    prevImportStatus.current = latest.importStatus
  }, [polled, lesson])

  const saving = updating
  const dirty =
    title.trim() !== lesson.title ||
    overview.trim() !== (lesson.overview ?? '') ||
    JSON.stringify(slides) !== JSON.stringify(lesson.slides)
  const canSave = title.trim() !== '' && dirty && !saving

  const save = async () => {
    if (!canSave) return
    setError(null)
    try {
      await updateLesson({
        courseId: course.id,
        lessonId: lesson.id,
        lesson: { title: title.trim(), type: 'slideshow', overview: overview.trim(), slides },
      }).unwrap()
      setSaved(true)
    } catch {
      setError('Could not save the slideshow. Is the API running?')
    }
  }

  const currentSlide = slides[Math.min(currentIndex, Math.max(slides.length - 1, 0))]
  const otherSlides = currentSlide ? slides.filter((s) => s.id !== currentSlide.id) : []

  const patchSlide = (slideId, patch) => {
    setSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, ...patch } : s)))
    setSaved(false)
  }

  const handleAddSlideFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const slide = await uploadSlide({ courseId: course.id, lessonId: lesson.id, file }).unwrap()
      setSlides((prev) => [...prev, slide])
      setCurrentIndex(slides.length)
    } catch {
      setError('Could not upload the slide image.')
    }
  }

  const handleReplaceImageFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !currentSlide) return
    try {
      const updated = await replaceImage({
        courseId: course.id,
        lessonId: lesson.id,
        slideId: currentSlide.id,
        file,
      }).unwrap()
      patchSlide(currentSlide.id, { image: updated.image })
    } catch {
      setError('Could not replace the slide image.')
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (slides.length > 0) {
      setPendingImportFile(file)
      setConfirmReimport(true)
      return
    }
    await runImport(file)
  }

  const runImport = async (file) => {
    setError(null)
    setConfirmReimport(false)
    setPendingImportFile(null)
    try {
      await importPptx({ courseId: course.id, lessonId: lesson.id, file }).unwrap()
      // Polling (above) picks up the pending -> done transition and re-seeds slides.
    } catch {
      setError('Could not start the import.')
    }
  }

  const removeSlide = async (slideId) => {
    try {
      await deleteSlide({ courseId: course.id, lessonId: lesson.id, slideId }).unwrap()
      setSlides((prev) =>
        prev
          .filter((s) => s.id !== slideId)
          // A dangling target (pointing at the slide just deleted) is a
          // harmless no-op click in the viewer, but tidy it up anyway.
          .map((s) => ({
            ...s,
            hotspots: s.hotspots.filter((h) => h.target !== slideId),
          })),
      )
      setCurrentIndex((i) => Math.max(0, Math.min(i, slides.length - 2)))
      setSaved(false)
    } catch {
      setError('Could not delete the slide.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <EditorHeader
        course={course}
        title={isPending ? 'Importing…' : 'Edit slideshow'}
        isEdit
        backTo={backTo}
        onCancel={() => navigate(backTo)}
        onSave={save}
        saving={saving}
        canSave={canSave}
        error={error}
      />

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setSaved(false)
          }}
          placeholder="Slideshow title"
          className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none"
        />
        <div className="mt-6">
          <Field label="Overview (optional)">
            <input
              type="text"
              value={overview}
              onChange={(e) => {
                setOverview(e.target.value)
                setSaved(false)
              }}
              className={inputClass}
            />
          </Field>
        </div>

        {saved && !dirty && <p className="mt-3 text-sm font-medium text-emerald-700">Saved.</p>}

        {isPending && (
          <div className="mt-6 border border-stone-300 bg-white px-4 py-3 text-sm text-stone-600">
            Importing your .pptx — this can take a little while for large decks…
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            Slides <span className="font-mono text-sm font-normal text-stone-400">({slides.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".pptx"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing || isPending}
              className={`${outlineButton} disabled:cursor-default disabled:opacity-40`}
            >
              Import from PPTX
            </button>
            <input
              ref={addSlideInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddSlideFile}
            />
            <button
              type="button"
              onClick={() => addSlideInputRef.current?.click()}
              disabled={uploading}
              className={`${blackButton} flex items-center gap-1.5`}
            >
              <PlusIcon size={14} /> Add slide
            </button>
          </div>
        </div>

        {slides.length === 0 ? (
          <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
            <span className="text-sm font-semibold text-stone-700">No slides yet</span>
            <span className="text-sm text-stone-500">Add an image or import a .pptx to get started.</span>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-[220px_1fr] gap-6">
            <ul className="space-y-2">
              {slides.map((slide, index) => (
                <SlideThumb
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isActive={index === currentIndex}
                  onSelect={() => setCurrentIndex(index)}
                  onDelete={() => setConfirmDeleteId(slide.id)}
                />
              ))}
            </ul>

            <div>
              {currentSlide && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={monoLabel}>
                      Slide {currentIndex + 1} — click and drag to draw a hotspot
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-stone-600">
                        <input
                          type="checkbox"
                          checked={currentSlide.isRequired}
                          onChange={(e) =>
                            patchSlide(currentSlide.id, { isRequired: e.target.checked })
                          }
                          className="size-4 accent-orange-600"
                        />
                        Required to complete
                      </label>
                      <input
                        ref={replaceImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleReplaceImageFile}
                      />
                      <button
                        type="button"
                        onClick={() => replaceImageInputRef.current?.click()}
                        disabled={replacing}
                        className="text-sm font-semibold text-stone-600 hover:text-orange-600"
                      >
                        Replace image
                      </button>
                    </div>
                  </div>
                  <SlideCanvas
                    slide={currentSlide}
                    otherSlides={otherSlides}
                    onAddHotspot={(hotspot) =>
                      patchSlide(currentSlide.id, { hotspots: [...currentSlide.hotspots, hotspot] })
                    }
                    onRetarget={(index, target) =>
                      patchSlide(currentSlide.id, {
                        hotspots: currentSlide.hotspots.map((h, i) => (i === index ? { ...h, target } : h)),
                      })
                    }
                    onDeleteHotspot={(index) =>
                      patchSlide(currentSlide.id, {
                        hotspots: currentSlide.hotspots.filter((_, i) => i !== index),
                      })
                    }
                  />
                </>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-stone-500">
          Slide images and deletes save immediately. Title, overview, hotspots and required
          slides save when you click "Save changes".
        </p>
      </main>

      {confirmDeleteId != null && (
        <ConfirmModal
          title="Delete slide"
          message="Delete this slide? Any hotspot pointing at it elsewhere will stop working. This cannot be undone."
          onConfirm={() => removeSlide(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}

      {confirmReimport && (
        <ConfirmModal
          title="Re-import from PPTX"
          message={`This will replace all ${slides.length} slide(s) and discard any hotspots you've drawn manually. Continue?`}
          confirmLabel="Replace slides"
          busy={importing}
          onConfirm={() => runImport(pendingImportFile)}
          onClose={() => {
            setConfirmReimport(false)
            setPendingImportFile(null)
          }}
        />
      )}
    </div>
  )
}

export default function SlideshowEditorPage() {
  const { courseId, lessonId } = useParams()
  const { data: course, isLoading: courseLoading, isError: courseError } = useGetCourseQuery(courseId)
  const {
    data: lesson,
    isLoading: lessonLoading,
    isError: lessonError,
  } = useGetLessonQuery({ courseId, lessonId }, { skip: !lessonId })

  if (courseLoading || (lessonId && lessonLoading)) {
    return <Notice>Loading…</Notice>
  }
  if (courseError || !course) return <Notice>Course not found</Notice>
  if (lessonId && (lessonError || !lesson)) return <Notice>Slideshow not found</Notice>

  if (!lessonId) return <NewSlideshowForm course={course} />
  return <SlideshowEditor key={lessonId} course={course} lesson={lesson} />
}
