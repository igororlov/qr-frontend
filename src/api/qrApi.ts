import { API_BASE_URL, apiRequest } from './client'
import { getToken } from '../auth/authStorage'
import type { PublicQr, QrCode, QrCodeInput, QrImageStyleInput } from '../types/qr'

export function listQrCodes(companyId: string) {
  return apiRequest<QrCode[]>(`/api/companies/${companyId}/qr-codes`)
}

export function createQrCode(companyId: string, body: QrCodeInput) {
  return apiRequest<QrCode>(`/api/companies/${companyId}/qr-codes`, {
    method: 'POST',
    body,
  })
}

export function updateQrCode(companyId: string, qrCodeId: string, body: QrCodeInput) {
  return apiRequest<QrCode>(`/api/companies/${companyId}/qr-codes/${qrCodeId}`, {
    method: 'PUT',
    body,
  })
}

export function generateQrCodeImage(companyId: string, qrCodeId: string, body: QrImageStyleInput) {
  return apiRequest<QrCode>(`/api/companies/${companyId}/qr-codes/${qrCodeId}/image`, {
    method: 'POST',
    body,
  })
}

export async function getQrCodePng(companyId: string, qrCodeId: string) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/qr-codes/${qrCodeId}/png`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }
  return response.blob()
}

export function getPublicQr(slug: string) {
  return apiRequest<PublicQr>(`/api/public/q/${slug}`, { auth: false })
}

export function trackPublicAction(slug: string, actionId: string) {
  return apiRequest<{ status: string }>(`/api/public/q/${slug}/actions/${actionId}/click`, {
    method: 'POST',
    auth: false,
  })
}

export function submitPublicForm(
  slug: string,
  body: { senderName?: string; senderEmail?: string; senderPhone?: string; message: string },
) {
  return apiRequest<{ submissionId: string; status: string }>(`/api/public/q/${slug}/submit-form`, {
    method: 'POST',
    auth: false,
    body,
  })
}
