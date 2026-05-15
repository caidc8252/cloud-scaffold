export type TerminalState = 'pending' | 'active'

export interface Store {
  id: string
  name: string
  isHQ: boolean
  address: string
  country: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Terminal {
  tid: string
  storeId: string
  state: TerminalState
  sn: string | null
  model: string | null
  lastSeen: string
  createdAt: string
  updatedAt: string

  merchantNameAcq?: string
  midAcq?: string
  tidAcq?: string
  address?: string
  subMerchantId?: string

  acquirerId?: string
  acquirerName?: string
  bankBin?: string
  settlementAccount?: string
  mcc?: string
  currency?: string
  country?: string
  timezone?: string

  cutoffTime?: string
  batchNumber?: string
  reversalHours?: number
  minTxAmount?: number
  maxTxAmount?: number
  dailyVolumeLimit?: number
  networkMode?: 'online' | 'mixed' | 'offline'

  cardSchemes?: string[]
  cvv2?: boolean
  avs?: boolean
  pinBypassAllowed?: boolean
  manualEntryAllowed?: boolean
  contactlessLimit?: number
  emvAids?: string

  tipAllowed?: boolean
  cashbackAllowed?: boolean
  refundAllowed?: boolean
  voidAllowed?: boolean
  preAuthAllowed?: boolean
  surchargeRate?: number
  dccEnabled?: boolean
  loyaltyIntegration?: boolean

  tokenizationProvider?: string
  encryption?: string
  keyIndex?: number
  tlsVersion?: string
  receiptHeader?: string
  receiptFooter?: string
}

export interface Merchant {
  id: string
  mid: string
  name: string
  country: string
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  stores: Store[]
  terminals: Terminal[]
}

export interface MerchantTotals {
  merchants: number
  stores: number
  terminals: number
  installed: number
}
