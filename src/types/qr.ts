export type QrActionType = 'LINK' | 'GOOGLE_REVIEW' | 'PHONE' | 'SMS' | 'EMAIL' | 'FORM'

export type QrAction = {
  id: string
  position: number
  label: string
  type: QrActionType
  value: string
  active: boolean
  clickCount: number
}

export type QrActionInput = {
  position: number
  label: string
  type: QrActionType
  value: string
  active: boolean
}

export type QrCodeInput = {
  slug: string
  title: string
  subtitle?: string | null
  label?: string | null
  logoUrl?: string | null
  active: boolean
  actions: QrActionInput[]
}

export type QrCode = {
  id: string
  companyId: string
  companyName: string
  slug: string
  title: string
  subtitle: string | null
  label: string | null
  logoUrl: string | null
  active: boolean
  scanCount: number
  actions: QrAction[]
  createdAt: string
  updatedAt: string
}

export type PublicQrAction = {
  id: string
  position: number
  label: string
  type: QrActionType
  value: string
}

export type PublicQr = {
  id: string
  companyName: string
  companySlug: string
  companyLogoUrl: string | null
  slug: string
  title: string
  subtitle: string | null
  label: string | null
  logoUrl: string | null
  actions: PublicQrAction[]
}
