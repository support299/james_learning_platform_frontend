import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  coursesApi,
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
import HotspotCanvas from '../components/HotspotCanvas.jsx'

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

function EditorHeader({ course, title, isEdit, onCancel, onSave, saving, canSave, error }) {
  return (
    <div className="sticky top-0 z-30 h-16 border-b border-stone-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            aria-label={`Back to ${course.title}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
          >
            <ArrowIcon direction="left" size={16} />
          </button>
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
  const dirty = title.trim() !== '' || overview.trim() !== ''

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

  const cancel = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    navigate(backTo)
  }

  return (
    <div className="min-h-svh bg-[#f6f5f2]">
      <SiteHeader />
      <EditorHeader
        course={course}
        title="New slideshow"
        isEdit={false}
        onCancel={cancel}
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

function SlideThumb({ slide, index, isActive, canDelete, onSelect, onDelete }) {
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
          tabIndex={canDelete ? 0 : -1}
          aria-disabled={!canDelete}
          onClick={(e) => {
            e.stopPropagation()
            if (canDelete) onDelete()
          }}
          aria-label={`Delete slide ${index + 1}`}
          className={`flex size-7 shrink-0 items-center justify-center text-stone-400 ${
            canDelete ? 'hover:text-red-600' : 'opacity-30'
          }`}
        >
          <TrashIcon size={14} />
        </span>
      </button>
    </li>
  )
}

function SlideshowEditor({ course, lesson }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
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

  // Re-seed local slides when an import just finished — never clobber
  // in-progress manual edits otherwise. The `missedReseed` fallback covers
  // a fresh/reopened editor (or any missed pending->done tick) landing on
  // an already-'done' lesson with slides that were never pulled into local
  // state — safe because it only fires while `slides` is still empty.
  useEffect(() => {
    const justFinished = prevImportStatus.current === 'pending' && lesson.importStatus === 'done'
    const missedReseed =
      lesson.importStatus === 'done' && slides.length === 0 && lesson.slides.length > 0
    if (justFinished || missedReseed) {
      setSlides(lesson.slides)
      setCurrentIndex(0)
      dispatch(coursesApi.util.invalidateTags([{ type: 'Course', id: course.id }]))
    }
    if (lesson.importStatus === 'failed' && prevImportStatus.current === 'pending') {
      setError(lesson.importError || 'Import failed.')
    }
    prevImportStatus.current = lesson.importStatus
  }, [lesson, dispatch, course.id, slides.length])

  const saving = updating
  const dirty =
    title.trim() !== lesson.title ||
    overview.trim() !== (lesson.overview ?? '') ||
    JSON.stringify(slides) !== JSON.stringify(lesson.slides)
  const canSave = title.trim() !== '' && dirty && !saving

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const cancelToBackTo = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    navigate(backTo)
  }

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
    } catch (err) {
      setError(err?.data?.detail || 'Could not start the import.')
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
        onCancel={cancelToBackTo}
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
              {importing ? 'Uploading…' : 'Import from PPTX'}
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
              disabled={uploading || isPending || importing}
              className={`${blackButton} flex items-center gap-1.5 disabled:cursor-default disabled:opacity-40`}
            >
              <PlusIcon size={14} /> {uploading ? 'Uploading…' : 'Add slide'}
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
                  canDelete={!isPending}
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
                        disabled={replacing || isPending || importing}
                        className="text-sm font-semibold text-stone-600 hover:text-orange-600 disabled:cursor-default disabled:opacity-40"
                      >
                        {replacing ? 'Uploading…' : 'Replace image'}
                      </button>
                    </div>
                  </div>
                  <HotspotCanvas
                    key={currentSlide.id}
                    image={currentSlide.image}
                    hotspots={currentSlide.hotspots}
                    targets={otherSlides.map((s, i) => ({ id: s.id, label: `Slide ${i + 1}` }))}
                    choosePrompt="Choose a slide…"
                    unknownLabel="Unknown slide"
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
    refetch: refetchLesson,
  } = useGetLessonQuery(
    { courseId, lessonId },
    { skip: !lessonId, refetchOnMountOrArgChange: true },
  )

  // A single query is the only source of truth for import progress — no
  // second `useGetLessonQuery` subscription in the child component, which
  // previously relied on both sharing one RTK Query cache entry to stay in
  // sync. Polling here via a plain interval + refetch() instead of RTK
  // Query's built-in pollingInterval removes that assumption entirely.
  useEffect(() => {
    if (lesson?.importStatus !== 'pending') return
    const id = setInterval(refetchLesson, 2000)
    return () => clearInterval(id)
  }, [lesson?.importStatus, refetchLesson])

  if (courseLoading || (lessonId && lessonLoading)) {
    return <Notice>Loading…</Notice>
  }
  if (courseError || !course) return <Notice>Course not found</Notice>
  if (lessonId && (lessonError || !lesson)) return <Notice>Slideshow not found</Notice>

  if (!lessonId) return <NewSlideshowForm course={course} />
  return <SlideshowEditor key={lessonId} course={course} lesson={lesson} />
}
