import axios from 'axios'
import {
  getApiBaseUrl,
  isHostedStaticApp,
  isLocalAppHost,
  STORAGE,
} from '../config'

const hosted = typeof window !== 'undefined' && isHostedStaticApp()
const local = typeof window !== 'undefined' && isLocalAppHost()

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  // Free hosts (Render) can take ~30–50s to wake after sleep
  timeout: hosted ? 60000 : 20000,
})

api.interceptors.request.use((config) => {
  const baseURL = getApiBaseUrl()
  if (!baseURL) {
    return Promise.reject(
      new Error(
        'API URL is not configured. Set public/runtime-config.json apiUrl (or VITE_API_URL) and redeploy.'
      )
    )
  }
  config.baseURL = baseURL
  config.headers = config.headers || {}

  const token =
    localStorage.getItem(STORAGE.TOKEN) || sessionStorage.getItem(STORAGE.TOKEN)
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
    const apiHost = getApiBaseUrl()

    if (error.message && !error.response && error.message.includes('API URL is not configured')) {
      message = error.message
    } else if (!error.response) {
      if (local) {
        message =
          'Cannot reach local API. Keep MongoDB on and run: npm start (or npm run server).'
      } else if (hosted) {
        message = `Cannot reach PahadLink API (${apiHost || 'not set'}). Deploy the API (e.g. Render) and set public/runtime-config.json apiUrl.`
      } else {
        message = 'Cannot reach server. Start API with: npm run server'
      }
    } else if (status === 502 || status === 503 || status === 504) {
      if (local) {
        message = 'Local API not ready. Keep MongoDB on and run: npm run server'
      } else if (hosted) {
        message =
          'API is waking up or offline. Wait ~30s and try again (free hosts sleep).'
      } else {
        message = 'API not running. Keep MongoDB on and run: npm run server'
      }
    } else if (status === 405 && hosted) {
      message =
        'API URL missing in this build. Set public/runtime-config.json apiUrl (or VITE_API_URL) and redeploy.'
    } else if (error.response.data?.message) {
      message = error.response.data.message
    } else if (typeof error.response.data === 'object' && error.response.data?.ok === false) {
      message = error.response.data.message || 'Invalid coupon'
    } else if (error.message) {
      message = error.message
    }

    return Promise.reject(new Error(message))
  }
)

export default api
