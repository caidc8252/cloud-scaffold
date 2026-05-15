import type { Merchant, Terminal } from '../data/types'

export interface VarSheetState {
  merchantNameAcq: string
  mid: string
  tid: string
  storeId: string
  address: string
  subMerchantId: string

  acquirerId: string
  acquirerName: string
  bankBin: string
  settlementAccount: string
  mcc: string
  currency: string
  country: string
  timezone: string

  cutoffTime: string
  batchNumber: string
  reversalHours: number
  minTxAmount: number
  maxTxAmount: number
  dailyVolumeLimit: number
  networkMode: 'online' | 'mixed' | 'offline'

  cardSchemes: string[]
  cvv2: boolean
  avs: boolean
  pinBypassAllowed: boolean
  manualEntryAllowed: boolean
  contactlessLimit: number
  emvAids: string

  tipAllowed: boolean
  cashbackAllowed: boolean
  refundAllowed: boolean
  voidAllowed: boolean
  preAuthAllowed: boolean
  surchargeRate: number
  dccEnabled: boolean
  loyaltyIntegration: boolean

  tokenizationProvider: string
  encryption: string
  keyIndex: number
  tlsVersion: string
  receiptHeader: string
  receiptFooter: string
}

export function makeInitialVarSheet(
  merchant: Merchant,
  terminal: Terminal | undefined,
  defaultStoreId: string | undefined,
): VarSheetState {
  const hq = merchant.stores.find((s) => s.isHQ)
  return {
    merchantNameAcq: terminal?.merchantNameAcq ?? merchant.name ?? '',
    mid: terminal?.midAcq ?? '',
    tid: terminal?.tidAcq ?? '',
    storeId: terminal?.storeId ?? defaultStoreId ?? hq?.id ?? merchant.stores[0]?.id ?? '',
    address: terminal?.address ?? '',
    subMerchantId: terminal?.subMerchantId ?? '',

    acquirerId: terminal?.acquirerId ?? 'ACQ-NB-CA-01',
    acquirerName: terminal?.acquirerName ?? 'Northbay Acquiring (CA)',
    bankBin: terminal?.bankBin ?? '424242',
    settlementAccount: terminal?.settlementAccount ?? '**** **** **** 4242',
    mcc: terminal?.mcc ?? '5812',
    currency: terminal?.currency ?? 'CAD',
    country: terminal?.country ?? 'CA',
    timezone: terminal?.timezone ?? 'America/Toronto',

    cutoffTime: terminal?.cutoffTime ?? '23:00',
    batchNumber: terminal?.batchNumber ?? '001',
    reversalHours: terminal?.reversalHours ?? 24,
    minTxAmount: terminal?.minTxAmount ?? 1,
    maxTxAmount: terminal?.maxTxAmount ?? 5000,
    dailyVolumeLimit: terminal?.dailyVolumeLimit ?? 50000,
    networkMode: terminal?.networkMode ?? 'online',

    cardSchemes: terminal?.cardSchemes ?? ['Visa', 'Mastercard', 'AMEX', 'Interac'],
    cvv2: terminal?.cvv2 ?? true,
    avs: terminal?.avs ?? false,
    pinBypassAllowed: terminal?.pinBypassAllowed ?? false,
    manualEntryAllowed: terminal?.manualEntryAllowed ?? true,
    contactlessLimit: terminal?.contactlessLimit ?? 250,
    emvAids: terminal?.emvAids ?? 'A0000000031010, A0000000041010, A0000002771010',

    tipAllowed: terminal?.tipAllowed ?? true,
    cashbackAllowed: terminal?.cashbackAllowed ?? false,
    refundAllowed: terminal?.refundAllowed ?? true,
    voidAllowed: terminal?.voidAllowed ?? true,
    preAuthAllowed: terminal?.preAuthAllowed ?? false,
    surchargeRate: terminal?.surchargeRate ?? 0,
    dccEnabled: terminal?.dccEnabled ?? false,
    loyaltyIntegration: terminal?.loyaltyIntegration ?? false,

    tokenizationProvider: terminal?.tokenizationProvider ?? 'TOMS Vault',
    encryption: terminal?.encryption ?? 'DUKPT',
    keyIndex: terminal?.keyIndex ?? 1,
    tlsVersion: terminal?.tlsVersion ?? '1.3',
    receiptHeader: terminal?.receiptHeader ?? '',
    receiptFooter: terminal?.receiptFooter ?? 'Thank you!',
  }
}

export const MID_PATTERN = /^[A-Z0-9]{15}$/
export const TID_PATTERN = /^\d{8}$/
