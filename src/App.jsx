import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import {
  setUser,
  selectIsAuthenticated,
  selectCurrentUser,
} from './store/authSlice.js'

function App() {
  const dispatch = useDispatch()
  const isAuthed = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const [fetchMe] = useLazyGetMeQuery()

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
