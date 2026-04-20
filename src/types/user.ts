export type UserRole = 'SYSTEM_ADMIN' | 'COMPANY_ADMIN'

export type User = {
  id: string
  email: string
  fullName: string
  role: UserRole
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type UserCreateInput = {
  email: string
  fullName: string
  password: string
  role: UserRole
}
