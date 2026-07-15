import api from './api'

export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
}

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data.user
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token, password) {
  const { data } = await api.post('/auth/reset-password', { token, password })
  return data
}

export async function googleLogin(credential) {
  const { data } = await api.post('/auth/google', { credential })
  return data
}

export async function sendOtp(phone) {
  const { data } = await api.post('/auth/otp/send', { phone })
  return data
}

export async function verifyOtp(phone, otp) {
  const { data } = await api.post('/auth/otp/verify', { phone, otp })
  return data
}

export async function listUsers() {
  const { data } = await api.get('/auth/users')
  return data.users
}

export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/auth/users/${userId}/role`, { role })
  return data
}
