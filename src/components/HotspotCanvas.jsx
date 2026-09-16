import { useRef, useState } from 'react'
import { inputClass } from './adminUi.jsx'
import { TrashIcon } from './Icons.jsx'

// A drag smaller than this (in image-fraction units) is treated as an
// accidental click rather than an intentional hotspot rectangle.
export const DRAG_THRESHOLD = 0.01

function targetFor(targets, id) {
  return targets.find((t) => String(t.id) === String(id))
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

// `targets` is the list of valid hotspot destinations, as [{id, label}] —
// sibling slides within a slideshow lesson, or sibling lessons within a
// course, depending on the caller.
export default function HotspotCanvas({
  image,
  hotspots,
  targets,
  onAddHotspot,
  onRetarget,
  onDeleteHotspot,
  choosePrompt = 'Choose a destination…',
  unknownLabel = 'Unknown',
}) {
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

  const targetLabelFor = (targetId) => targetFor(targets, targetId)?.label ?? unknownLabel

  return (
    <div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full touch-none cursor-crosshair overflow-hidden rounded-lg border border-stone-300 bg-stone-100 select-none"
      >
        <img src={image} alt="" className="pointer-events-none block w-full" draggable={false} />
        {hotspots.map((h, i) => (
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
              const target = targetFor(targets, e.target.value)
              if (!target) return
              onAddHotspot({ ...draft, target: target.id })
              setDraft(null)
            }}
          >
            <option value="" disabled>
              {choosePrompt}
            </option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setDraft(null)} className="text-sm font-medium text-stone-500 hover:text-stone-800">
            Cancel
          </button>
        </div>
      )}

      {selectedIndex !== null && hotspots[selectedIndex] && (
        <div className="mt-3 flex items-center gap-3 border border-stone-300 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-stone-800">Hotspot — jumps to:</span>
          <select
            className={`${inputClass} w-auto`}
            value={hotspots[selectedIndex].target ?? ''}
            onChange={(e) => {
              const target = targetFor(targets, e.target.value)
              if (target) onRetarget(selectedIndex, target.id)
            }}
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
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
