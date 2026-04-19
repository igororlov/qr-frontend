import { apiRequest } from './client'
import type { Company } from '../types/company'

export function listCompanies() {
  return apiRequest<Company[]>('/api/companies')
}
