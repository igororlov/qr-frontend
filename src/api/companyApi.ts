import { apiRequest } from './client'
import type { Company, CompanyInput } from '../types/company'

export function listCompanies() {
  return apiRequest<Company[]>('/api/companies')
}

export function createCompany(body: CompanyInput) {
  return apiRequest<Company>('/api/companies', {
    method: 'POST',
    body,
  })
}

export function updateCompany(companyId: string, body: CompanyInput) {
  return apiRequest<Company>(`/api/companies/${companyId}`, {
    method: 'PUT',
    body,
  })
}

export function deleteCompany(companyId: string) {
  return apiRequest<void>(`/api/companies/${companyId}`, {
    method: 'DELETE',
  })
}
