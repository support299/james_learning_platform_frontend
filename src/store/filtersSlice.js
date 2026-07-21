import { createSlice } from '@reduxjs/toolkit'

const filtersSlice = createSlice({
  name: 'filters',
  initialState: {
    query: '',
    category: 'All',
    page: 1,
  },
  reducers: {
    setQuery(state, action) {
      state.query = action.payload
      state.page = 1
    },
    setCategory(state, action) {
      state.category = action.payload
      state.page = 1
    },
    setPage(state, action) {
      state.page = action.payload
    },
  },
})

export const { setQuery, setCategory, setPage } = filtersSlice.actions
export default filtersSlice.reducer
