export type Company = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  active: boolean
  ownerUserId: string
  ownerEmail: string
  createdAt: string
  updatedAt: string
}

export type CompanyInput = {
  name: string
  slug: string
  logoUrl?: string | null
  active: boolean
  ownerUserId?: string | null
}
