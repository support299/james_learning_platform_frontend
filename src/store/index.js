import { configureStore } from '@reduxjs/toolkit'
import coursesReducer, { STORAGE_KEY } from './coursesSlice.js'
import filtersReducer from './filtersSlice.js'

export const store = configureStore({
  reducer: {
    courses: coursesReducer,
    filters: filtersReducer,
  },
})

let lastList = store.getState().courses.list
store.subscribe(() => {
  const { list } = store.getState().courses
  if (list !== lastList) {
    lastList = list
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
      // storage full/unavailable — persistence is best-effort in the prototype
    }
  }
})
