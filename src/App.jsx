import { Routes, Route, Navigate } from 'react-router-dom'
import CoursesPage from './pages/CoursesPage.jsx'
import LessonPage from './pages/LessonPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import CourseEditPage from './pages/CourseEditPage.jsx'
import LessonEditorPage from './pages/LessonEditorPage.jsx'
import QuizEditorPage from './pages/QuizEditorPage.jsx'
import RequireAuth from './components/RequireAuth.jsx'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Everything else requires a logged-in user */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
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
          path="/course/:courseId/lesson/:lessonId"
          element={<LessonPage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
