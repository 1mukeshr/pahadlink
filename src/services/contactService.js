import api from './api'

export async function submitContact(payload) {
  const { data } = await api.post('/contact', payload)
  return data
}
