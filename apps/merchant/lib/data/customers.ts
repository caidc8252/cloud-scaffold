import type { Role } from './roles'

export type ContractStatus = 'Active' | 'Pending' | 'Terminated' | 'Signed'
export type ContractKind = 'ISV' | 'ISO' | 'Acquirer' | 'PayFac'
export type CustomerStatus = 'Active' | 'Onboarding' | 'Suspended'

export interface Contract {
  kind: ContractKind
  status: ContractStatus
  signedAt: string | null
  signedBy: string | null
}

export interface Operator {
  name: string
  email: string
  phone: string
  role: string
  lastLogin: string | null
  pending?: boolean
  locked?: boolean
}

export interface CustomerEvent {
  at: string
  kind: string
  by: string
  text: string
}

export interface Customer {
  id: string
  name: string
  address: string
  license: string
  notes: string
  status: CustomerStatus
  registeredAt: string
  contracts: Contract[]
  operators: Operator[]
  events: CustomerEvent[]
  deniedRoles?: string[]
  customRoles?: Role[]
}

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'c-001',
    name: 'Northwind Commerce',
    address: '1455 Market Street, Suite 600, San Francisco, CA 94103, USA',
    license: 'NW-2024-08831-CA',
    notes: 'Mid-market e-commerce platform; expanding into card-present in Q3.',
    status: 'Active',
    registeredAt: '2025-08-14T10:12:00Z',
    contracts: [
      { kind: 'ISV', status: 'Active', signedAt: '2025-08-16T15:22:00Z', signedBy: 'sarah.chen@northwind.example' },
      { kind: 'ISO', status: 'Active', signedAt: '2025-09-02T09:41:00Z', signedBy: 'sarah.chen@northwind.example' },
    ],
    operators: [
      { name: 'Sarah Chen',    email: 'sarah.chen@northwind.example',    phone: '+1 415 226 4821', role: 'Admin',    lastLogin: '2026-05-11T08:14:00Z' },
      { name: 'Marcus Webb',   email: 'marcus.webb@northwind.example',   phone: '+1 415 887 2104', role: 'Operator', lastLogin: '2026-05-10T17:31:00Z' },
      { name: 'Priya Anand',   email: 'priya.anand@northwind.example',   phone: '+1 415 220 9938', role: 'Operator', lastLogin: '2026-05-09T11:02:00Z' },
      { name: 'Daniel Okafor', email: 'daniel.okafor@northwind.example', phone: '+1 415 559 7163', role: 'Viewer',   lastLogin: '2026-04-28T22:48:00Z' },
    ],
    events: [
      { at: '2025-08-14T10:12:00Z', kind: 'created',   by: 'admin@carbon', text: 'Company registered' },
      { at: '2025-08-14T10:18:00Z', kind: 'contract+', by: 'admin@carbon', text: 'ISV contract configured · active' },
      { at: '2025-08-16T15:22:00Z', kind: 'contract✓', by: 'sarah.chen@northwind.example', text: 'ISV contract signed' },
      { at: '2025-08-18T09:02:00Z', kind: 'operator+', by: 'sarah.chen@northwind.example', text: 'Operator invited · marcus.webb@northwind.example' },
      { at: '2025-09-01T14:11:00Z', kind: 'contract+', by: 'admin@carbon', text: 'ISO contract configured · active' },
      { at: '2025-09-02T09:41:00Z', kind: 'contract✓', by: 'sarah.chen@northwind.example', text: 'ISO contract signed' },
      { at: '2026-03-04T16:08:00Z', kind: 'info',      by: 'admin@carbon', text: 'License field updated' },
    ],
  },
  {
    id: 'c-002',
    name: 'Helios Payments',
    address: '200 W Madison St, Floor 24, Chicago, IL 60606, USA',
    license: '',
    notes: '',
    status: 'Onboarding',
    registeredAt: '2026-04-22T13:48:00Z',
    contracts: [
      { kind: 'ISV', status: 'Active',  signedAt: '2026-04-24T11:05:00Z', signedBy: 'admin@helios.example' },
      { kind: 'ISO', status: 'Active',  signedAt: '2026-04-22T13:48:00Z', signedBy: 'admin@carbon' },
    ],
    operators: [
      { name: 'Elena Rossi', email: 'elena.rossi@helios.example', phone: '+1 312 445 1190', role: 'Admin', lastLogin: '2026-05-12T07:02:00Z' },
    ],
    events: [
      { at: '2026-04-22T13:48:00Z', kind: 'created',   by: 'admin@carbon', text: 'Company registered' },
      { at: '2026-04-22T13:51:00Z', kind: 'contract+', by: 'admin@carbon', text: 'ISV contract added' },
      { at: '2026-04-22T13:51:00Z', kind: 'contract+', by: 'admin@carbon', text: 'ISO contract added' },
      { at: '2026-04-23T09:14:00Z', kind: 'operator+', by: 'admin@carbon', text: 'First operator invited · elena.rossi@helios.example' },
      { at: '2026-04-24T11:05:00Z', kind: 'contract✓', by: 'elena.rossi@helios.example', text: 'ISV contract signed' },
    ],
  },
  {
    id: 'c-003',
    name: 'Brightleaf Retail',
    address: '88 King St E, Toronto, ON M5C 1G3, Canada',
    license: 'BL-CAN-44217',
    notes: 'Multi-store specialty retailer (24 locations).',
    status: 'Active',
    registeredAt: '2025-03-09T18:00:00Z',
    contracts: [
      { kind: 'ISO', status: 'Active', signedAt: '2025-03-12T20:30:00Z', signedBy: 'admin@brightleaf.example' },
    ],
    operators: [
      { name: 'Henry Tremblay', email: 'henry.tremblay@brightleaf.example', phone: '+1 416 991 2207', role: 'Admin',    lastLogin: '2026-05-11T19:50:00Z' },
      { name: 'Jasmine Park',   email: 'jasmine.park@brightleaf.example',   phone: '+1 416 220 4488', role: 'Operator', lastLogin: '2026-05-10T13:18:00Z' },
    ],
    events: [
      { at: '2025-03-09T18:00:00Z', kind: 'created',   by: 'admin@carbon', text: 'Company registered' },
      { at: '2025-03-12T20:30:00Z', kind: 'contract✓', by: 'admin@brightleaf.example', text: 'ISO contract signed' },
    ],
  },
  {
    id: 'c-004',
    name: 'Vanta Software',
    address: 'Bahnhofstrasse 12, 8001 Zürich, Switzerland',
    license: '',
    notes: '',
    status: 'Active',
    registeredAt: '2025-11-19T08:21:00Z',
    contracts: [
      { kind: 'ISV', status: 'Active', signedAt: '2025-11-21T10:00:00Z', signedBy: 'admin@vanta.example' },
      { kind: 'ISO', status: 'Active', signedAt: '2026-04-22T13:48:00Z', signedBy: 'admin@carbon' },
    ],
    operators: [
      { name: 'Lukas Meier', email: 'lukas.meier@vanta.example', phone: '+41 44 555 8821', role: 'Admin', lastLogin: '2026-05-11T15:00:00Z' },
    ],
    events: [
      { at: '2025-11-19T08:21:00Z', kind: 'created',   by: 'admin@carbon', text: 'Company registered' },
      { at: '2025-11-21T10:00:00Z', kind: 'contract✓', by: 'admin@vanta.example', text: 'ISV contract signed' },
      { at: '2026-05-09T11:24:00Z', kind: 'contract+', by: 'admin@carbon',        text: 'ISO contract configured · active' },
    ],
  },
  {
    id: 'c-005',
    name: 'Coastline Hospitality',
    address: '1700 Ocean Blvd, Miami Beach, FL 33139, USA',
    license: 'FL-HSP-22019',
    notes: 'Boutique hotel group, 6 properties.',
    status: 'Suspended',
    registeredAt: '2024-12-02T11:00:00Z',
    contracts: [
      { kind: 'ISO', status: 'Terminated', signedAt: '2025-01-04T09:00:00Z', signedBy: 'admin@coastline.example' },
    ],
    operators: [
      { name: 'Maria Alvarez', email: 'maria.alvarez@coastline.example', phone: '+1 305 442 8810', role: 'Admin',    lastLogin: '2026-02-10T14:22:00Z', locked: true },
      { name: 'Carlos Mendez', email: 'carlos.mendez@coastline.example', phone: '+1 305 779 1144', role: 'Operator', lastLogin: '2026-02-09T19:05:00Z' },
    ],
    events: [
      { at: '2024-12-02T11:00:00Z', kind: 'created', by: 'admin@carbon', text: 'Company registered' },
      { at: '2026-02-11T16:00:00Z', kind: 'warn',    by: 'admin@carbon', text: 'Status changed to Suspended' },
    ],
  },
  {
    id: 'c-006',
    name: 'Loomis Industrial',
    address: '4500 Industrial Pkwy, Houston, TX 77032, USA',
    license: '',
    notes: '',
    status: 'Onboarding',
    registeredAt: '2026-05-09T09:32:00Z',
    contracts: [
      { kind: 'ISV', status: 'Active', signedAt: '2026-05-09T09:32:00Z', signedBy: 'admin@carbon' },
    ],
    operators: [
      { name: '',              email: 'ops.lead@loomis.example',      phone: '',               role: 'Admin',    lastLogin: null, pending: true },
      { name: 'Rachel Yoon',   email: 'rachel.yoon@loomis.example',   phone: '+1 832 220 6643', role: 'Operator', lastLogin: '2026-05-11T16:48:00Z' },
      { name: 'Tomás Herrera', email: 'tomas.herrera@loomis.example', phone: '+1 832 559 9120', role: 'Viewer',   lastLogin: '2026-05-10T08:14:00Z' },
    ],
    events: [
      { at: '2026-05-09T09:32:00Z', kind: 'created',   by: 'admin@carbon', text: 'Company registered' },
      { at: '2026-05-09T09:35:00Z', kind: 'contract+', by: 'admin@carbon', text: 'ISV contract configured · active' },
    ],
  },
]
