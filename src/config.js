// Single source of truth for the Django API location. Set VITE_API_URL in .env.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
