import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CoursesPage from './pages/CoursesPage.jsx'
import LessonPage from './pages/LessonPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import StudentDetailPage from './pages/StudentDetailPage.jsx'
import CourseEditPage from './pages/CourseEditPage.jsx'
import LessonEditorPage from './pages/LessonEditorPage.jsx'
import QuizEditorPage from './pages/QuizEditorPage.jsx'
import SlideshowEditorPage from './pages/SlideshowEditorPage.jsx'
import ImageLessonEditorPage from './pages/ImageLessonEditorPage.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequireStaff from './components/RequireStaff.jsx'
import RequireSuperadmin from './components/RequireSuperadmin.jsx'
import RequireOnboarding from './components/RequireOnboarding.jsx'
import OnboardingLayout from './components/onboarding/OnboardingLayout.jsx'
import DashboardPage from './pages/onboarding/DashboardPage.jsx'
import AgentsPage from './pages/onboarding/AgentsPage.jsx'
import AgentDetailPage from './pages/onboarding/AgentDetailPage.jsx'
import AgentSelfPage from './pages/onboarding/AgentSelfPage.jsx'
import CohortsPage from './pages/onboarding/CohortsPage.jsx'
import AuditPage from './pages/onboarding/AuditPage.jsx'
import SettingsPage from './pages/onboarding/SettingsPage.jsx'
import { useLazyGetMeQuery } from './store/authApi.js'
import { useGhlAutoLoginMutation } from './store/ghlApi.js'
import {
  setCredentials,
  setUser,
  selectIsAuthenticated,
  selectCurrentUser,
} from './store/authSlice.js'

// Home iframe: /?logid={{user.id}}&locationId={{location.id}} → courses
// Agent iframe: /agent-user?logid={{user.id}}&locationId={{location.id}} → /onboarding/me
function ghlLoginFrom(search) {
  const params = new URLSearchParams(search)
  return {
    logid: params.get('logid'),
    locationId: params.get('locationId') || params.get('location_id') || '',
  }
}

function isAgentUserPath(pathname) {
  return pathname === '/agent-user' || pathname === '/agent-user/'
}

function stripGhlLoginParams(search) {
  const params = new URLSearchParams(search)
  params.delete('logid')
  params.delete('locationId')
  params.delete('location_id')
  return params.toString()
}

function App() {
  const dispatch = useDispatch()
  const isAuthed = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const [fetchMe] = useLazyGetMeQuery()

  const location = useLocation()
  const navigate = useNavigate()
  const [autoLogin] = useGhlAutoLoginMutation()
  const { logid, locationId } = ghlLoginFrom(location.search)
  // Seeded from the URL rather than defaulting to false: the exchange only
  // starts after the first paint, and by then RequireAuth would already have
  // bounced a signed-out visitor to /login and lost the id.
  const [signingIn, setSigningIn] = useState(() =>
    Boolean(ghlLoginFrom(window.location.search).logid),
  )

  useEffect(() => {
    if (!logid) return
    setSigningIn(true)
    autoLogin({ logid, locationId })
      .unwrap()
      .then((session) => {
        dispatch(setCredentials(session))
        const rest = stripGhlLoginParams(location.search)
        const dest = isAgentUserPath(location.pathname)
          ? `/onboarding/me${rest ? `?${rest}` : ''}`
          : `${location.pathname}${rest ? `?${rest}` : ''}`
        navigate(dest, { replace: true })
      })
      .catch(() => {
        // Unknown or unlinked id — fall through to the normal login page.
        const rest = stripGhlLoginParams(location.search)
        navigate(`${location.pathname}${rest ? `?${rest}` : ''}`, {
          replace: true,
        })
      })
      .finally(() => {
        setSigningIn(false)
      })
    // Keyed on the id + location: the callbacks above are what change
    // `location`, and re-running on that would restart the exchange it just finished.
  }, [logid, locationId])

  // Sessions restored from localStorage may predate `is_staff` (or have gone
  // stale since), so refresh the user once on load to settle the admin gate
  // and the isolated onboarding_role.
  const staffUnknown = isAuthed && user?.is_staff === undefined
  const onboardingUnknown =
    isAuthed && user?.is_staff && !('onboarding_role' in (user || {}))
  const superadminUnknown =
    isAuthed && user?.is_staff && !('is_superuser' in (user || {}))
  useEffect(() => {
    if (!staffUnknown && !onboardingUnknown && !superadminUnknown) return
    fetchMe()
      .unwrap()
      .then((me) => dispatch(setUser(me)))
      .catch(() => {
        // Token expired or the API is down — RequireAuth/login handles it.
      })
  }, [staffUnknown, onboardingUnknown, superadminUnknown, fetchMe, dispatch])

  // Hold the routes back while the GHL id is exchanged, so the visitor sees a
  // sign-in splash instead of a flash of the login page they're bypassing.
  if (signingIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Everything else requires a logged-in user */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<CoursesPage />} />
        <Route
          path="/agent-user"
          element={<Navigate to="/onboarding/me" replace />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/course/:courseId/lesson/:lessonId"
          element={<LessonPage />}
        />
        <Route path="/onboarding/me" element={<AgentSelfPage />} />

        {/* Agent Onboarding Tracker — isolated staff module */}
        <Route element={<RequireOnboarding />}>
          <Route path="/onboarding" element={<OnboardingLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/:agentId" element={<AgentDetailPage />} />
            <Route path="cohorts" element={<CohortsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* The admin area additionally requires a staff account */}
        <Route element={<RequireStaff />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route element={<RequireSuperadmin />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
          <Route
            path="/admin/students/:studentId"
            element={<StudentDetailPage />}
          />
          <Route path="/admin/course/:courseId" element={<CourseEditPage />} />
          <Route
            path="/admin/course/:courseId/lesson/new"
            element={<LessonEditorPage />}
          />
          <Route
            path="/admin/course/:courseId/lesson/:lessonId/edit"
            element={<LessonEditorPage />}
          />
          <Route
            path="/admin/course/:courseId/quiz/new"
            element={<QuizEditorPage />}
          />
          <Route
            path="/admin/course/:courseId/quiz/:lessonId/edit"
            element={<QuizEditorPage />}
          />
          <Route
            path="/admin/course/:courseId/slideshow/new"
            element={<SlideshowEditorPage />}
          />
          <Route
            path="/admin/course/:courseId/slideshow/:lessonId/edit"
            element={<SlideshowEditorPage />}
          />
          <Route
            path="/admin/course/:courseId/lesson/:lessonId/image-edit"
            element={<ImageLessonEditorPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
