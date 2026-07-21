import { Routes, Route, Navigate } from 'react-router-dom'
import CoursesPage from './pages/CoursesPage.jsx'
import LessonPage from './pages/LessonPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import CourseEditPage from './pages/CourseEditPage.jsx'
import LessonEditorPage from './pages/LessonEditorPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CoursesPage />} />
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
      <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
