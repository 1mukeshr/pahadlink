import axios from 'axios'
import { getApiBaseUrl, STORAGE } from '../config'

const onGithubPages =
  typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname)

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: onGithubPages ? 60000 : 20000,
})

api.interceptors.request.use((config) => {
  const baseURL = getApiBaseUrl()
  if (!baseURL) {
    return Promise.reject(
      new Error(
        'API URL is not configured. Set VITE_API_URL or public/runtime-config.json apiUrl.'
      )
    )
  }
  config.baseURL = baseURL

  const token = localStorage.getItem(STORAGE.TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Something went wrong'
    const status = error.response?.status
    if (error.message && !error.response && error.message.includes('API URL is not configured')) {
      message = error.message
    } else if (!error.response) {
      message = onGithubPages
        ? 'Cannot reach PahadLink API. Deploy the API and set runtime-config.json or VITE_API_URL.'
        : 'Cannot reach server. Start API with: npm run server'
    } else if (status === 502 || status === 503 || status === 504) {
      message = onGithubPages
        ? 'API is waking up or offline. Wait ~30s and try again (free hosts sleep).'
        : 'API not running. Keep MongoDB on and run: npm run server'
    } else if (status === 405 && onGithubPages) {
      message =
        'API URL missing in this build. Set public/runtime-config.json apiUrl (or VITE_API_URL) and redeploy.'
    } else if (error.response.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    return Promise.reject(new Error(message))
  }
)

export default api
