import { apiRequest } from './client'
import type { PublicQr, QrCode } from '../types/qr'

export function listQrCodes(companyId: string) {
  return apiRequest<QrCode[]>(`/api/companies/${companyId}/qr-codes`)
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
