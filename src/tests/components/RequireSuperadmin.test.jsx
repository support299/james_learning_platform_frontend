import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import authReducer from '../../store/authSlice.js'
import RequireSuperadmin from '../../components/RequireSuperadmin.jsx'

function renderAt(auth) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, access: 'a', refresh: 'r', ...auth } },
  })
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/admin" element={<p>admin home</p>} />
          <Route element={<RequireSuperadmin />}>
            <Route path="/admin/users" element={<p>users page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('RequireSuperadmin', () => {
  test('superadmin gets the page', () => {
    renderAt({ isSuperadmin: true })
    expect(screen.getByText('users page')).toBeInTheDocument()
  })

  test('plain staff is sent back to /admin', () => {
    renderAt({ isSuperadmin: false })
    expect(screen.getByText('admin home')).toBeInTheDocument()
  })

  test('holds while the flag is still unknown instead of redirecting', () => {
    renderAt({})
    expect(screen.getByText(/checking access/i)).toBeInTheDocument()
  })
})
