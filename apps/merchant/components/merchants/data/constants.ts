export const COUNTRIES = [
  'Canada',
  'United States',
  'Mexico',
  'United Kingdom',
  'Germany',
  'France',
  'Australia',
  'Japan',
  'Singapore',
  'Brazil',
] as const

export const CARD_SCHEMES = [
  'Visa',
  'Mastercard',
  'AMEX',
  'Discover',
  'JCB',
  'UnionPay',
  'Interac',
] as const

export const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'JPY', 'SGD', 'MXN'] as const

export const COUNTRY_CODES = ['CA', 'US', 'MX', 'GB', 'DE', 'FR', 'AU', 'JP', 'SG', 'BR'] as const

export const TIMEZONES = [
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Halifax',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
] as const

export const NETWORK_MODES = [
  { value: 'online', label: 'Online only' },
  { value: 'mixed', label: 'Mixed (online + store-and-forward)' },
  { value: 'offline', label: 'Offline only' },
] as const

export const TOKENIZATION_PROVIDERS = ['TOMS Vault', 'Visa VTS', 'Mastercard MDES', 'None'] as const

export const ENCRYPTION_METHODS = ['DUKPT', 'Master/Session', 'Fixed'] as const

export const TLS_VERSIONS = ['1.2', '1.3'] as const
