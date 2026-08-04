import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  useGetVideoProgressQuery,
  useReportVideoProgressMutation,
} from '../store/coursesApi.js'
import { API_BASE_URL } from '../config.js'
import { extractEmbedId } from '../utils/videoEmbed.js'
import { loadYouTubeIframeApi } from '../utils/youtubeApi.js'

const HEARTBEAT_INTERVAL_MS = 10_000
const SKIP_POLL_INTERVAL_MS = 1000
// A buffer on top of actual elapsed wall-clock time, not a flat window:
// normal 1x playback alone already advances ~1 video second between poll
// ticks, so a flat tolerance smaller than the poll interval (as this used
// to be) falsely flags *all* normal playback as a skip and permanently
// loops it back to the same position.
const ANTI_SKIP_TOLERANCE_SECONDS = 1
// Ceiling on how much elapsed-time credit a single check can grant, no
// matter how long the actual gap since the last check was. Without this,
// holding/dragging the seek bar keeps the main thread too busy for our poll
// to run at all until release — so a long hold produces one big gap, which
// this design would otherwise read as "that many seconds of legitimate
// playback happened" and grant a matching allowance to whatever position
// the drag landed on. Capping it means a starved tick is only ever treated
// as if a normal tick had passed, regardless of how long the stall was.
const MAX_POLL_CREDIT_SECONDS = 2
const LOOM_ORIGIN = 'https://www.loom.com'
const PROGRESS_CACHE_PREFIX = 'video-progress'

// How long the tab has to have been hidden before becoming visible again
// counts as "was inactive for a while" and triggers a fresh fetch from the
// backend. Short tab-switches trust the local cache; longer gaps might mean
// the user watched more on another device/tab in between.
const INACTIVITY_REFETCH_THRESHOLD_MS = 5 * 60 * 1000

// Between refresh/reactivation checkpoints, watched position lives in
// localStorage — the backend is only written to (fire-and-forget) and never
// read from or corrected against during normal playback.
function progressCacheKey(courseId, lessonId, provider, externalId) {
  return `${PROGRESS_CACHE_PREFIX}:${courseId}:${lessonId}:${provider}:${externalId}`
}

function readCachedProgress(courseId, lessonId, provider, externalId) {
  try {
    const raw = localStorage.getItem(progressCacheKey(courseId, lessonId, provider, externalId))
    const parsed = raw && JSON.parse(raw)
    return typeof parsed?.maxWatchedSeconds === 'number' ? parsed : null
  } catch {
    return null
  }
}

function writeCachedProgress(courseId, lessonId, state) {
  try {
    localStorage.setItem(
      progressCacheKey(courseId, lessonId, state.provider, state.externalId),
      JSON.stringify({
        maxWatchedSeconds: state.maxWatchedSeconds,
        durationSeconds: state.durationSeconds,
      }),
    )
  } catch {
    // localStorage unavailable (private mode / quota) — cache is best-effort
  }
}

// A deliberate, rate-limited way to move forward past the anti-skip lock —
// matches the backend's own per-heartbeat jump allowance
// (MAX_WATCHED_JUMP_TOLERANCE_SECONDS in views.py), so the resulting
// maxWatchedSeconds is accepted without any server-side change.
const SKIP_FORWARD_SECONDS = 15
const SKIP_COOLDOWN_MS = 60_000

// Turns a failed heartbeat into a message worth showing the user. Doesn't
// touch playback (writes stay fire-and-forget either way) — this is purely
// informational, so the user isn't left thinking progress is being saved
// when it silently isn't.
function describeReportFailure(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return "You're offline — your video progress isn't being saved."
  }
  if (error?.status === 'FETCH_ERROR') {
    return "Can't reach the server — your video progress isn't being saved."
  }
  return "Couldn't save your video progress. It'll retry automatically."
}

// Wraps a lesson's rendered html and instruments every YouTube/Loom embed
// inside it for watch-progress tracking: restores playback position,
// blocks skipping ahead of the furthest point reached, and reports
// heartbeats (watched position + focused time) so the backend can gate
// lesson completion on real playback. A lesson can embed more than one
// video, so each embed is tracked independently — except that starting
// one pauses every other tracked embed in the same lesson, so at most one
// plays at a time.
export default function VideoProgressTracker({ courseId, lessonId, children }) {
  const containerRef = useRef(null)
  const { data: progress = [], refetch: refetchProgress } = useGetVideoProgressQuery({
    courseId,
    lessonId,
  })
  const [reportProgress] = useReportVideoProgressMutation()
  const accessToken = useSelector((state) => state.auth?.access)
  const [reportError, setReportError] = useState(null)

  // Mutable tracking state that shouldn't trigger re-renders as it changes.
  const trackersRef = useRef(new Map()) // key `${provider}:${externalId}` -> tracker state
  const focusedSecondsRef = useRef(0)
  const lastVisibleAtRef = useRef(document.visibilityState === 'visible' ? Date.now() : null)
  const hiddenAtRef = useRef(document.visibilityState === 'hidden' ? Date.now() : null)

  // Keep the latest fetched progress available to the setup effect without
  // re-running it every time the cache updates from our own heartbeats.
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    // `data-embed` wrappers are part of the lesson's static html and are
    // never replaced by React (dangerouslySetInnerHTML skips re-applying
    // identical html), so they're a stable anchor to key tracking off —
    // unlike the raw <iframe>, which YouTube's player takes ownership of
    // and removes on destroy (see setUpYouTube).
    const wrappers = container.querySelectorAll('[data-embed]')
    const cleanups = []
    const seenKeys = new Set()

    wrappers.forEach((wrapper) => {
      const provider = wrapper.getAttribute('data-provider')
      if (provider !== 'youtube' && provider !== 'loom') return

      // Cache the id on the wrapper the first time: after a YouTube setup
      // runs once, the original <iframe> may already be gone, so it can't
      // be re-derived from iframe src on a later run of this effect.
      let externalId = wrapper.getAttribute('data-external-id')
      if (!externalId) {
        const rawIframe = wrapper.querySelector('iframe')
        externalId = rawIframe && extractEmbedId(provider, rawIframe.getAttribute('src'))
        if (!externalId) return
        wrapper.setAttribute('data-external-id', externalId)
      }

      const key = `${provider}:${externalId}`
      seenKeys.add(key)
      const existing = trackersRef.current.get(key)
      // Local cache is the normal source of truth for "how far has this
      // been watched"; the fetch behind `progressRef` only runs on mount and
      // on the reactivation-after-inactivity refetch below, so `saved` here
      // only ever reflects one of those two checkpoints, never a live poll.
      const cached = readCachedProgress(courseId, lessonId, provider, externalId)
      const saved = progressRef.current.find(
        (p) => p.provider === provider && p.externalId === externalId,
      )
      const state = {
        provider,
        externalId,
        // Prefer the in-memory position over cache/server so a redundant
        // re-run of this effect (e.g. React StrictMode's mount-cleanup-mount)
        // can't seek playback backward; otherwise take the furthest of what
        // was cached locally and what the backend last knew.
        maxWatchedSeconds:
          existing?.maxWatchedSeconds ??
          Math.max(cached?.maxWatchedSeconds ?? 0, saved?.maxWatchedSeconds ?? 0),
        durationSeconds:
          existing?.durationSeconds ?? cached?.durationSeconds ?? saved?.durationSeconds ?? null,
        getCurrentTime: () => 0,
        seekTo: () => {},
        pause: () => {},
      }
      trackersRef.current.set(key, state)

      // Only one embed in a lesson should ever be playing at once: whichever
      // one starts playing tells every other tracked embed to pause.
      const notifyPlaying = () => {
        for (const [otherKey, otherState] of trackersRef.current) {
          if (otherKey !== key) otherState.pause()
        }
      }

      if (provider === 'youtube') {
        cleanups.push(setUpYouTube(wrapper, state, notifyPlaying))
        // Only wired for YouTube: state.seekTo is a no-op for Loom (see
        // setUpLoom), so the button would have nothing to act on there.
        cleanups.push(setUpSkipButton(wrapper, state))
      } else {
        const iframe = wrapper.querySelector('iframe')
        if (iframe) cleanups.push(setUpLoom(iframe, state, notifyPlaying))
      }
      // Vimeo (or any other recognized-but-untracked provider) is left as a
      // plain embed — no tracking wired up for it yet.
    })

    for (const key of trackersRef.current.keys()) {
      if (!seenKeys.has(key)) trackersRef.current.delete(key)
    }

    return () => cleanups.forEach((fn) => fn?.())
  }, [courseId, lessonId])

  // Surfaces a connectivity loss immediately, without waiting for the next
  // heartbeat to fail — the browser fires 'offline' as soon as the network
  // interface itself goes down.
  useEffect(() => {
    function handleOffline() {
      setReportError(describeReportFailure({}))
    }
    function handleOnline() {
      setReportError(null)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Merges freshly fetched backend progress into already-running trackers,
  // without touching the player (only ever raises the ceiling, never seeks —
  // "the backend doesn't interfere" with in-progress playback). This only
  // has new data to apply right after the initial fetch and after the
  // reactivation-after-inactivity refetch below; in between, `progress`
  // barely changes and merging is a no-op.
  useEffect(() => {
    for (const p of progress) {
      const state = trackersRef.current.get(`${p.provider}:${p.externalId}`)
      if (!state) continue
      state.maxWatchedSeconds = Math.max(state.maxWatchedSeconds, p.maxWatchedSeconds ?? 0)
      state.durationSeconds ??= p.durationSeconds ?? null
      writeCachedProgress(courseId, lessonId, state)
    }
  }, [progress, courseId, lessonId])

  // Focused-time accounting: only counts while the tab is visible. Also
  // watches for the tab coming back after a long-enough absence to warrant
  // re-fetching progress from the backend instead of trusting the local
  // cache (e.g. the user watched further on another device/tab meanwhile).
  useEffect(() => {
    function flushFocusedSeconds() {
      if (lastVisibleAtRef.current == null) return
      const now = Date.now()
      focusedSecondsRef.current += (now - lastVisibleAtRef.current) / 1000
      lastVisibleAtRef.current = now
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        lastVisibleAtRef.current = Date.now()
        if (
          hiddenAtRef.current != null &&
          Date.now() - hiddenAtRef.current >= INACTIVITY_REFETCH_THRESHOLD_MS
        ) {
          refetchProgress()
        }
        hiddenAtRef.current = null
      } else {
        flushFocusedSeconds()
        lastVisibleAtRef.current = null
        hiddenAtRef.current = Date.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      flushFocusedSeconds()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refetchProgress])

  // Heartbeat: every ~10s, persist each tracked embed's current position to
  // the local cache and fire off a best-effort report to the backend. The
  // backend write is fire-and-forget — its response is never read back to
  // correct or gate local playback; the local cache is what anti-skip and
  // resume-position rely on in between refresh/reactivation checkpoints.
  useEffect(() => {
    function flushFocusedSeconds() {
      if (lastVisibleAtRef.current == null) return
      const now = Date.now()
      focusedSecondsRef.current += (now - lastVisibleAtRef.current) / 1000
      lastVisibleAtRef.current = now
    }

    function sendHeartbeat(useBeacon) {
      flushFocusedSeconds()
      const focusedDeltaSeconds = focusedSecondsRef.current
      focusedSecondsRef.current = 0

      for (const state of trackersRef.current.values()) {
        // Deliberately NOT `state.maxWatchedSeconds = Math.max(..., state.getCurrentTime())`
        // here: getCurrentTime() is a raw, unvalidated sample, and the only
        // thing gating forward movement of maxWatchedSeconds is the anti-skip
        // poll (YouTube) / message handler (Loom). If the heartbeat ratcheted
        // it too, a heartbeat tick landing in the brief window right after an
        // unauthorized seek — before the poll's own check catches it — would
        // lock the cheated position in as the new legitimate ceiling, and the
        // poll would have nothing left to correct afterward. maxWatchedSeconds
        // is already the furthest *validated* point, so that's what's reported.
        if (!state.getCurrentTime()) continue
        writeCachedProgress(courseId, lessonId, state)

        const body = {
          provider: state.provider,
          external_id: state.externalId,
          current_time: state.maxWatchedSeconds,
          focused_delta_seconds: focusedDeltaSeconds,
          duration_seconds: state.durationSeconds,
        }
        if (useBeacon) {
          // Best-effort final flush on unload; RTK Query's fetch isn't
          // guaranteed to complete once the page is going away. Plain
          // sendBeacon can't attach the JWT Authorization header this API
          // requires, so a keepalive fetch is used instead.
          fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/video-progress/`, {
            method: 'POST',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(body),
          }).catch(() => {})
        } else {
          // Fire-and-forget for playback purposes (nothing here corrects or
          // gates the player), but the outcome still drives the banner below
          // so a persistently failing save is visible instead of silent.
          reportProgress({
            courseId,
            lessonId,
            provider: state.provider,
            externalId: state.externalId,
            currentTime: state.maxWatchedSeconds,
            focusedDeltaSeconds,
            durationSeconds: state.durationSeconds,
          }).then((result) => {
            setReportError(result?.error ? describeReportFailure(result.error) : null)
          })
        }
      }
    }

    const intervalId = setInterval(() => sendHeartbeat(false), HEARTBEAT_INTERVAL_MS)
    const handlePageHide = () => sendHeartbeat(true)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('pagehide', handlePageHide)
      sendHeartbeat(true)
    }
  }, [courseId, lessonId, reportProgress, accessToken])

  return (
    <div>
      {reportError && (
        <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {reportError}
        </div>
      )}
      <div ref={containerRef}>{children}</div>
    </div>
  )
}

function setUpYouTube(wrapper, state, onPlay) {
  // YT.Player takes ownership of whatever element it's given and removes it
  // from the DOM on destroy(). Mounting into a disposable child of `wrapper`
  // (instead of the wrapper, or the original static <iframe>, directly)
  // means a destroy-then-recreate cycle — which React StrictMode always
  // triggers once on mount — only ever discards our own throwaway node,
  // never the stable, lesson-html-owned wrapper this effect re-queries by.
  let mount = wrapper.querySelector(':scope > [data-video-mount]')
  if (!mount) {
    mount = document.createElement('div')
    mount.setAttribute('data-video-mount', '')
    const rawIframe = wrapper.querySelector('iframe')
    if (rawIframe) {
      rawIframe.replaceWith(mount)
    } else {
      wrapper.appendChild(mount)
    }
  }
  const target = document.createElement('div')
  mount.replaceChildren(target)

  let player = null
  let pollId = null
  let cancelled = false

  loadYouTubeIframeApi().then((YT) => {
    if (cancelled || !YT) return
    player = new YT.Player(target, {
      videoId: state.externalId,
      playerVars: { enablejsapi: 1, origin: window.location.origin },
      events: {
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) onPlay()
        },
        onReady: () => {
          state.durationSeconds = player.getDuration() || state.durationSeconds
          if (state.maxWatchedSeconds > 0) {
            player.seekTo(state.maxWatchedSeconds, true)
          }
          // Runs for the player's whole lifetime rather than being
          // started/stopped on PLAYING/BUFFERING transitions: clicking the
          // seek bar briefly flips the player into BUFFERING, and clicking
          // faster than one poll tick apart used to tear the interval down
          // and restart its timer before it ever got to check a position —
          // so continuous clicking went through completely unchecked.
          let lastPollAt = Date.now()
          pollId = setInterval(() => {
            const now = Date.now()
            const elapsedSeconds = Math.min((now - lastPollAt) / 1000, MAX_POLL_CREDIT_SECONDS)
            lastPollAt = now
            const rate = player.getPlaybackRate?.() || 1
            const current = player.getCurrentTime()
            // Playback advances on its own between ticks (faster still if
            // sped up), so the allowed ceiling has to move with real
            // elapsed time — a flat comparison here would flag ordinary
            // playback as a skip. See ANTI_SKIP_TOLERANCE_SECONDS. Capped by
            // MAX_POLL_CREDIT_SECONDS so a starved/delayed tick can't grant
            // an outsized allowance.
            const allowed = state.maxWatchedSeconds + elapsedSeconds * rate + ANTI_SKIP_TOLERANCE_SECONDS
            if (current > allowed) {
              player.seekTo(state.maxWatchedSeconds, true)
            } else {
              state.maxWatchedSeconds = Math.max(state.maxWatchedSeconds, current)
            }
          }, SKIP_POLL_INTERVAL_MS)
        },
      },
    })
  })

  state.getCurrentTime = () => (player ? player.getCurrentTime() : 0)
  state.seekTo = (seconds) => player?.seekTo(seconds, true)
  state.pause = () => player?.pauseVideo?.()

  return () => {
    cancelled = true
    if (pollId) clearInterval(pollId)
    try {
      player?.destroy?.()
    } catch {
      // Navigating to a lesson whose html also contains a video replaces
      // this whole subtree (dangerouslySetInnerHTML) before this cleanup
      // runs, so the player's iframe can already be detached from the
      // document. YT's destroy() assumes it still has a parent to remove
      // itself from and throws otherwise — nothing left to clean up either
      // way, but left unguarded this throw was aborting the rest of this
      // effects pass, which is what set up the *next* lesson's player.
    }
  }
}

// A small "+15s" control rendered under the embed. Bypasses the anti-skip
// poll deliberately (rather than loosening ANTI_SKIP_TOLERANCE_SECONDS,
// which would let a dragged seek re-arm every poll tick and stair-step
// through the whole video) and is rate-limited so it can't be used the
// same way.
function setUpSkipButton(wrapper, state) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = `+${SKIP_FORWARD_SECONDS}s`
  button.className =
    'mt-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

  let cooldownTimeoutId = null

  function handleClick() {
    const target = Math.min(
      state.maxWatchedSeconds + SKIP_FORWARD_SECONDS,
      state.durationSeconds ?? Infinity,
    )
    state.maxWatchedSeconds = target
    state.seekTo(target)

    button.disabled = true
    cooldownTimeoutId = setTimeout(() => {
      button.disabled = false
    }, SKIP_COOLDOWN_MS)
  }

  button.addEventListener('click', handleClick)
  wrapper.insertAdjacentElement('afterend', button)

  return () => {
    if (cooldownTimeoutId) clearTimeout(cooldownTimeoutId)
    button.removeEventListener('click', handleClick)
    button.remove()
  }
}

// Loom has no official player-events SDK; this listens for its embed's
// postMessage events on a best-effort basis. The exact event/field names
// aren't formally documented, so this defensively checks a few known shapes
// and should be re-verified against a real Loom embed before relying on it.
function setUpLoom(iframe, state, onPlay) {
  let currentTime = 0
  let lastEventAt = Date.now()

  function handleMessage(event) {
    if (event.origin !== LOOM_ORIGIN || event.source !== iframe.contentWindow) return
    const data = typeof event.data === 'string' ? safeJsonParse(event.data) : event.data
    if (!data) return

    // Same caveat as the seek postMessage below: Loom's outbound event
    // names aren't formally documented, so this checks the shapes observed
    // in the wild rather than a confirmed contract.
    const eventType = typeof data.event === 'string' ? data.event.toLowerCase() : null
    if (eventType === 'play' || eventType === 'playing') onPlay()

    const reportedTime = data.currentTime ?? data.playhead ?? data.seconds
    const reportedDuration = data.duration ?? data.videoDuration

    if (typeof reportedDuration === 'number') state.durationSeconds = reportedDuration
    if (typeof reportedTime !== 'number') return

    const now = Date.now()
    const elapsedSeconds = Math.min((now - lastEventAt) / 1000, MAX_POLL_CREDIT_SECONDS)
    lastEventAt = now
    // Same reasoning as the YouTube poll: Loom's own event cadence is
    // unknown, so the ceiling has to track real elapsed time rather than a
    // flat window, or ordinary playback risks tripping the clamp. Capped by
    // MAX_POLL_CREDIT_SECONDS for the same reason too — a long gap between
    // messages (e.g. the main thread busy handling a seek-bar drag) can't
    // grant an outsized allowance.
    const allowed = state.maxWatchedSeconds + elapsedSeconds + ANTI_SKIP_TOLERANCE_SECONDS
    if (reportedTime > allowed) {
      // Best-effort seek correction; Loom's inbound command contract is
      // unverified, so this may not have any effect on some embeds.
      iframe.contentWindow?.postMessage(
        { event: 'seek', seconds: state.maxWatchedSeconds },
        LOOM_ORIGIN,
      )
    } else {
      currentTime = reportedTime
      state.maxWatchedSeconds = Math.max(state.maxWatchedSeconds, reportedTime)
    }
  }

  window.addEventListener('message', handleMessage)
  state.getCurrentTime = () => currentTime
  // Best-effort, same as the seek command above — may not affect playback
  // on all embeds since Loom's inbound command contract is unverified.
  state.pause = () => iframe.contentWindow?.postMessage({ event: 'pause' }, LOOM_ORIGIN)

  return () => window.removeEventListener('message', handleMessage)
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
