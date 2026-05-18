export type ContractKind = 'ISV' | 'ISO' | 'Acquirer' | 'PayFac'

export interface PermissionItem {
  id: string
  label: string
  desc: string
  contracts?: ContractKind[]
}

export interface PermissionGroup {
  id: string
  label: string
  items: PermissionItem[]
}

export interface Role {
  id: string
  name: string
  description: string
  builtin: boolean
  operatorCount: number
  contractMode: 'allow' | 'deny'
  contractsAllowed: ContractKind[]
  permissions: string[]
  updatedAt: string
  updatedBy: string
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'customers', label: 'Customer management',
    items: [
      { id: 'cust.view',    label: 'View customers',         desc: 'Read customer profiles and metadata' },
      { id: 'cust.edit',    label: 'Edit customer details',  desc: 'Update name, address, license, notes' },
      { id: 'cust.create',  label: 'Register new customer',  desc: 'Run the onboarding wizard' },
      { id: 'cust.suspend', label: 'Suspend / reactivate',   desc: 'Change customer status' },
      { id: 'cust.delete',  label: 'Delete customer',        desc: 'Permanently remove (audit retained)' },
    ],
  },
  {
    id: 'contracts', label: 'Contracts',
    items: [
      { id: 'ctr.view',      label: 'View contracts',      desc: 'See signed and pending contracts',    contracts: ['ISV','ISO','Acquirer','PayFac'] },
      { id: 'ctr.add',       label: 'Add contract',        desc: 'Attach a new contract to a customer', contracts: ['ISV','ISO','Acquirer','PayFac'] },
      { id: 'ctr.sign',      label: 'Sign on behalf',      desc: 'Counter-sign / mark signed',          contracts: ['ISV','ISO','Acquirer','PayFac'] },
      { id: 'ctr.terminate', label: 'Terminate contract',  desc: 'End an active contract',              contracts: ['ISV','ISO','Acquirer','PayFac'] },
    ],
  },
  {
    id: 'operators', label: 'Operators',
    items: [
      { id: 'op.view',   label: 'View operators',       desc: 'See operator list & masked contacts' },
      { id: 'op.invite', label: 'Invite operator',      desc: 'Send invitation link / QR code' },
      { id: 'op.role',   label: 'Change operator role', desc: 'Assign roles defined here' },
      { id: 'op.lock',   label: 'Lock / unlock account',desc: 'Force-revoke session' },
      { id: 'op.mfa',    label: 'Reset MFA',            desc: 'Trigger MFA reset flow' },
      { id: 'op.remove', label: 'Remove operator',      desc: 'Detach operator from customer' },
    ],
  },
  {
    id: 'data', label: 'Sensitive data & audit',
    items: [
      { id: 'data.reveal', label: 'Reveal masked PII', desc: 'Unmask emails / phones (logged)' },
      { id: 'data.export', label: 'Export to CSV',     desc: 'Bulk download operator / contract lists' },
      { id: 'audit.view',  label: 'View audit log',    desc: 'Read system event history' },
    ],
  },
  {
    id: 'system', label: 'System administration',
    items: [
      { id: 'sys.roles',     label: 'Manage roles & permissions', desc: 'Edit role definitions on this page' },
      { id: 'sys.templates', label: 'Edit contract templates',    desc: 'Maintain ISV / ISO / Acquirer / PayFac text', contracts: ['ISV','ISO','Acquirer','PayFac'] },
      { id: 'sys.notify',    label: 'Manage notifications',       desc: 'Edit email / webhook routing' },
      { id: 'sys.keys',      label: 'Manage API keys',            desc: 'Rotate organization-level credentials' },
    ],
  },
]

export const ALL_CONTRACT_KINDS: ContractKind[] = ['ISV', 'ISO', 'Acquirer', 'PayFac']

export const SEED_ROLES: Role[] = [
  {
    id: 'r-operator',
    name: 'Operator',
    description: 'Day-to-day onboarding and contract handling. No system-level admin.',
    builtin: true,
    operatorCount: 8,
    contractMode: 'deny',
    contractsAllowed: ['PayFac'],
    permissions: ['cust.view','cust.edit','cust.create','ctr.view','ctr.add','ctr.sign','op.view','op.invite','op.role','data.export','audit.view'],
    updatedAt: '2026-03-18T09:14:00Z',
    updatedBy: 'admin@carbon',
  },
  {
    id: 'r-viewer',
    name: 'Viewer',
    description: 'Read-only access. Cannot reveal PII or change anything.',
    builtin: true,
    operatorCount: 3,
    contractMode: 'deny',
    contractsAllowed: [],
    permissions: ['cust.view','ctr.view','op.view','audit.view'],
    updatedAt: '2026-02-04T12:00:00Z',
    updatedBy: 'admin@carbon',
  },
  {
    id: 'r-compliance',
    name: 'Compliance Officer',
    description: 'Audit & sensitive-data access. Limited write scope.',
    builtin: false,
    operatorCount: 2,
    contractMode: 'deny',
    contractsAllowed: [],
    permissions: ['cust.view','ctr.view','ctr.terminate','op.view','data.reveal','data.export','audit.view'],
    updatedAt: '2026-04-29T17:42:00Z',
    updatedBy: 'jordan.d@carbon',
  },
  {
    id: 'r-isv-partner',
    name: 'ISV Partner Manager',
    description: 'Manages ISV relationships only. Cannot touch acquirer or PayFac contracts.',
    builtin: false,
    operatorCount: 4,
    contractMode: 'allow',
    contractsAllowed: ['ISV'],
    permissions: ['cust.view','cust.edit','ctr.view','ctr.add','ctr.sign','op.view','op.invite','audit.view'],
    updatedAt: '2026-05-06T10:21:00Z',
    updatedBy: 'jordan.d@carbon',
  },
]
