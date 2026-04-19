import { apiRequest } from './client'
import type { LoginResponse, User } from '../types/auth'

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
}

export function getMe() {
  return apiRequest<User>('/api/auth/me')
}
