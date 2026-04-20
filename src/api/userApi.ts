import { apiRequest } from './client'
import type { User, UserCreateInput } from '../types/user'

export function listUsers() {
  return apiRequest<User[]>('/api/users')
}

export function createUser(body: UserCreateInput) {
  return apiRequest<User>('/api/users', {
    method: 'POST',
    body,
  })
}
