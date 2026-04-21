export type QrActionType = 'LINK' | 'GOOGLE_REVIEW' | 'PHONE' | 'SMS' | 'EMAIL' | 'FORM'
export type QrFormType = 'contact' | 'feedback' | 'lead'

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
  buttonColor: string
  textColor: string
  imageStyle: QrImageStyleInput
  actions: QrActionInput[]
}

export type QrImageStyle = {
  foregroundColor: string
  backgroundColor: string
  logoEnabled: boolean
  imageGenerated: boolean
  imageGeneratedAt: string | null
}

export type QrImageStyleInput = {
  foregroundColor: string
  backgroundColor: string
  logoEnabled: boolean
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
  buttonColor: string
  textColor: string
  active: boolean
  scanCount: number
  imageStyle: QrImageStyle
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
  buttonColor: string
  textColor: string
  actions: PublicQrAction[]
}
