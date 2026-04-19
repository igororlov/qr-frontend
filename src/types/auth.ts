export type UserRole = 'SYSTEM_ADMIN' | 'COMPANY_ADMIN'

export type User = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export type LoginResponse = {
  token: string
  user: User
}
