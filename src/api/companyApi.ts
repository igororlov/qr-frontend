import { getToken } from '../auth/authStorage'
import { API_BASE_URL, ApiError, apiRequest } from './client'
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

export async function uploadCompanyLogo(companyId: string, file: File) {
  const formData = new FormData()
  formData.set('file', file)
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(await readUploadError(response), response.status)
  }

  return response.json() as Promise<Company>
}

async function readUploadError(response: Response) {
  try {
    const body = await response.json()
    return body.detail ?? body.message ?? `Request failed with ${response.status}`
  } catch {
    return `Request failed with ${response.status}`
  }
}
