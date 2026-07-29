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
import StudentDetailPage from './pages/StudentDetailPage.jsx'
import CourseEditPage from './pages/CourseEditPage.jsx'
import LessonEditorPage from './pages/LessonEditorPage.jsx'
import QuizEditorPage from './pages/QuizEditorPage.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequireStaff from './components/RequireStaff.jsx'
import { useLazyGetMeQuery } from './store/authApi.js'
import { useGhlAutoLoginMutation } from './store/ghlApi.js'
import {
  setCredentials,
  setUser,
  selectIsAuthenticated,
  selectCurrentUser,
} from './store/authSlice.js'

// The academy link sent from GoHighLevel arrives as `/?logid={{user.id}}`.
function logidFrom(search) {
  return new URLSearchParams(search).get('logid')
}

function App() {
  const dispatch = useDispatch()
  const isAuthed = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const [fetchMe] = useLazyGetMeQuery()

  const location = useLocation()
  const navigate = useNavigate()
  const [autoLogin] = useGhlAutoLoginMutation()
  const logid = logidFrom(location.search)
  // Seeded from the URL rather than defaulting to false: the exchange only
  // starts after the first paint, and by then RequireAuth would already have
  // bounced a signed-out visitor to /login and lost the id.
  const [signingIn, setSigningIn] = useState(() =>
    Boolean(logidFrom(window.location.search)),
  )

  useEffect(() => {
    if (!logid) return
    setSigningIn(true)
    autoLogin(logid)
      .unwrap()
      .then((session) => dispatch(setCredentials(session)))
      .catch(() => {
        // Unknown or unlinked id — fall through to the normal login page.
      })
      .finally(() => {
        // Drop the id from the address bar so a reload or a bookmark doesn't
        // repeat the exchange, keeping any other params intact.
        const params = new URLSearchParams(location.search)
        params.delete('logid')
        const rest = params.toString()
        navigate(`${location.pathname}${rest ? `?${rest}` : ''}`, {
          replace: true,
        })
        setSigningIn(false)
      })
    // Keyed on the id alone: the callbacks above are what change `location`,
    // and re-running on that would restart the exchange it just finished.
  }, [logid])

  // Sessions restored from localStorage may predate `is_staff` (or have gone
  // stale since), so refresh the user once on load to settle the admin gate.
  const staffUnknown = isAuthed && user?.is_staff === undefined
  useEffect(() => {
    if (!staffUnknown) return
    fetchMe()
      .unwrap()
      .then((me) => dispatch(setUser(me)))
      .catch(() => {
        // Token expired or the API is down — RequireAuth/login handles it.
      })
  }, [staffUnknown, fetchMe, dispatch])

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
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/course/:courseId/lesson/:lessonId"
          element={<LessonPage />}
        />

        {/* The admin area additionally requires a staff account */}
        <Route element={<RequireStaff />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
