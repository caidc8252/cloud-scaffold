'use client'

import type { ReactNode } from 'react'
import {
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@cloud/ui'
import {
  CARD_SCHEMES,
  COUNTRY_CODES,
  CURRENCIES,
  ENCRYPTION_METHODS,
  NETWORK_MODES,
  TIMEZONES,
  TLS_VERSIONS,
  TOKENIZATION_PROVIDERS,
} from '../data/constants'
import type { Store } from '../data/types'
import { MID_PATTERN, TID_PATTERN, type VarSheetState } from './var-sheet-state'

export type VarSheetSectionId = 'identity' | 'acquirer' | 'ops' | 'cards' | 'features' | 'security'

export const VAR_SHEET_SECTIONS: { id: VarSheetSectionId; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'acquirer', label: 'Acquirer' },
  { id: 'ops', label: 'Operations' },
  { id: 'cards', label: 'Cards & auth' },
  { id: 'features', label: 'Features' },
  { id: 'security', label: 'Security & receipts' },
]

interface SectionProps {
  vs: VarSheetState
  setField: <K extends keyof VarSheetState>(key: K, value: VarSheetState[K]) => void
  selectedStore?: Store
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
}

function Full({ children }: { children: ReactNode }) {
  return <div className="md:col-span-2">{children}</div>
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ChipMulti({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== opt) : [...value, opt])}
            className={
              on
                ? 'px-2.5 py-1 rounded-full text-[12px] font-medium bg-primary-50 text-primary-700 border border-primary-200'
                : 'px-2.5 py-1 rounded-full text-[12px] font-medium bg-surface-2 text-content-secondary border border-line-default hover:bg-surface-hover'
            }
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function IdentitySection({ vs, setField, selectedStore }: SectionProps) {
  const midInvalid = vs.mid.length > 0 && !MID_PATTERN.test(vs.mid)
  const tidInvalid = vs.tid.length > 0 && !TID_PATTERN.test(vs.tid)
  return (
    <FormGrid>
      <Full>
        <Field
          label="Acquirer merchant name"
          required
          hint="The name your acquirer uses for this merchant. Often differs from how you know them internally."
        >
          <Input
            value={vs.merchantNameAcq}
            onChange={(e) => setField('merchantNameAcq', e.target.value)}
            placeholder="e.g. RIVERSIDE COFFEE CO LTD"
          />
        </Field>
      </Full>
      <Field
        label="Merchant No. (MID)"
        required
        hint={
          <>
            15 characters — digits or uppercase letters. <span className="font-mono">{vs.mid.length}</span> / 15
          </>
        }
        error={midInvalid ? 'Must be exactly 15 characters, digits or uppercase letters only.' : null}
      >
        <Input
          value={vs.mid}
          onChange={(e) => setField('mid', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
          invalid={midInvalid}
          className="font-mono"
          placeholder="e.g. 821048275AB12CD"
        />
      </Field>
      <Field
        label="Terminal No. (TID)"
        required
        hint={
          <>
            8 digits. <span className="font-mono">{vs.tid.length}</span> / 8
          </>
        }
        error={tidInvalid ? 'Must be exactly 8 digits.' : null}
      >
        <Input
          value={vs.tid}
          onChange={(e) => setField('tid', e.target.value.replace(/\D/g, '').slice(0, 8))}
          invalid={tidInvalid}
          className="font-mono"
          placeholder="e.g. 01029281"
        />
      </Field>
      <Full>
        <Field
          label="Terminal address (override)"
          hint={
            <>
              Leave blank to inherit from <b>{selectedStore?.name ?? 'the store'}</b>. Sets the address printed on
              receipts and reported to the acquirer.
            </>
          }
        >
          <Input
            value={vs.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder={selectedStore?.address || 'Street, city, postal code'}
          />
        </Field>
      </Full>
    </FormGrid>
  )
}

export function AcquirerSection({ vs, setField }: SectionProps) {
  return (
    <FormGrid>
      <Field label="Acquirer ID" required>
        <Input value={vs.acquirerId} onChange={(e) => setField('acquirerId', e.target.value)} className="font-mono" />
      </Field>
      <Field label="Acquirer name">
        <Input value={vs.acquirerName} onChange={(e) => setField('acquirerName', e.target.value)} />
      </Field>
      <Field label="Bank BIN" required>
        <Input
          value={vs.bankBin}
          onChange={(e) => setField('bankBin', e.target.value)}
          className="font-mono"
          placeholder="6-digit BIN"
        />
      </Field>
      <Field label="Settlement account">
        <Input
          value={vs.settlementAccount}
          onChange={(e) => setField('settlementAccount', e.target.value)}
          className="font-mono"
        />
      </Field>
      <Field label="MCC" required hint="Merchant Category Code (ISO 18245)">
        <Input
          value={vs.mcc}
          onChange={(e) => setField('mcc', e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="font-mono"
          placeholder="e.g. 5812"
        />
      </Field>
      <Field label="Currency" required>
        <SelectField
          value={vs.currency}
          onChange={(v) => setField('currency', v)}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </Field>
      <Field label="Country" required>
        <SelectField
          value={vs.country}
          onChange={(v) => setField('country', v)}
          options={COUNTRY_CODES.map((c) => ({ value: c, label: c }))}
        />
      </Field>
      <Field label="Time zone">
        <SelectField
          value={vs.timezone}
          onChange={(v) => setField('timezone', v)}
          options={TIMEZONES.map((t) => ({ value: t, label: t }))}
        />
      </Field>
    </FormGrid>
  )
}

export function OpsSection({ vs, setField }: SectionProps) {
  return (
    <FormGrid>
      <Field label="Settlement cut-off time" hint="Local time. Batches close at this hour.">
        <Input
          type="time"
          value={vs.cutoffTime}
          onChange={(e) => setField('cutoffTime', e.target.value)}
          className="font-mono"
        />
      </Field>
      <Field label="Starting batch number">
        <Input
          value={vs.batchNumber}
          onChange={(e) => setField('batchNumber', e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="font-mono"
        />
      </Field>
      <Field label="Reversal window (hours)" hint="How long after auth a void/reversal is allowed.">
        <Input
          type="number"
          value={vs.reversalHours}
          onChange={(e) => setField('reversalHours', Number(e.target.value))}
          min={0}
          max={168}
          className="font-mono"
        />
      </Field>
      <Field label="Network mode">
        <SelectField
          value={vs.networkMode}
          onChange={(v) => setField('networkMode', v as VarSheetState['networkMode'])}
          options={NETWORK_MODES.map((m) => ({ value: m.value, label: m.label }))}
        />
      </Field>
      <Field label="Min transaction amount" hint={`In ${vs.currency}`}>
        <Input
          type="number"
          step="0.01"
          value={vs.minTxAmount}
          onChange={(e) => setField('minTxAmount', Number(e.target.value))}
          className="font-mono"
        />
      </Field>
      <Field label="Max transaction amount" hint={`In ${vs.currency}`}>
        <Input
          type="number"
          step="1"
          value={vs.maxTxAmount}
          onChange={(e) => setField('maxTxAmount', Number(e.target.value))}
          className="font-mono"
        />
      </Field>
      <Field label="Daily volume limit" hint={`In ${vs.currency}`}>
        <Input
          type="number"
          step="100"
          value={vs.dailyVolumeLimit}
          onChange={(e) => setField('dailyVolumeLimit', Number(e.target.value))}
          className="font-mono"
        />
      </Field>
    </FormGrid>
  )
}

export function CardsSection({ vs, setField }: SectionProps) {
  return (
    <FormGrid>
      <Full>
        <Field label="Card schemes enabled" required>
          <ChipMulti options={CARD_SCHEMES} value={vs.cardSchemes} onChange={(v) => setField('cardSchemes', v)} />
        </Field>
      </Full>
      <Full>
        <Field label="EMV AIDs" hint="Comma-separated. The Application Identifiers the kernel will negotiate.">
          <Input value={vs.emvAids} onChange={(e) => setField('emvAids', e.target.value)} className="font-mono" />
        </Field>
      </Full>
      <Field label="Contactless limit" hint={`In ${vs.currency}. PIN required above this amount.`}>
        <Input
          type="number"
          step="1"
          value={vs.contactlessLimit}
          onChange={(e) => setField('contactlessLimit', Number(e.target.value))}
          className="font-mono"
        />
      </Field>
      <Field label="CVV2 verification">
        <Switch checked={vs.cvv2} onCheckedChange={(v) => setField('cvv2', v)} />
      </Field>
      <Field label="AVS check">
        <Switch checked={vs.avs} onCheckedChange={(v) => setField('avs', v)} />
      </Field>
      <Field label="PIN bypass allowed" hint="Allow signature fallback when PIN is unavailable.">
        <Switch checked={vs.pinBypassAllowed} onCheckedChange={(v) => setField('pinBypassAllowed', v)} />
      </Field>
      <Field label="Manual PAN entry">
        <Switch checked={vs.manualEntryAllowed} onCheckedChange={(v) => setField('manualEntryAllowed', v)} />
      </Field>
    </FormGrid>
  )
}

export function FeaturesSection({ vs, setField }: SectionProps) {
  return (
    <FormGrid>
      <Field label="Tip allowed">
        <Switch checked={vs.tipAllowed} onCheckedChange={(v) => setField('tipAllowed', v)} />
      </Field>
      <Field label="Cashback allowed">
        <Switch checked={vs.cashbackAllowed} onCheckedChange={(v) => setField('cashbackAllowed', v)} />
      </Field>
      <Field label="Refund allowed">
        <Switch checked={vs.refundAllowed} onCheckedChange={(v) => setField('refundAllowed', v)} />
      </Field>
      <Field label="Void allowed">
        <Switch checked={vs.voidAllowed} onCheckedChange={(v) => setField('voidAllowed', v)} />
      </Field>
      <Field label="Pre-authorization">
        <Switch checked={vs.preAuthAllowed} onCheckedChange={(v) => setField('preAuthAllowed', v)} />
      </Field>
      <Field label="Surcharge rate (%)" hint="Pass-on cost added to each transaction. 0 = no surcharge.">
        <Input
          type="number"
          step="0.1"
          value={vs.surchargeRate}
          onChange={(e) => setField('surchargeRate', Number(e.target.value))}
          className="font-mono"
        />
      </Field>
      <Field label="DCC enabled" hint="Dynamic currency conversion for foreign cards.">
        <Switch checked={vs.dccEnabled} onCheckedChange={(v) => setField('dccEnabled', v)} />
      </Field>
      <Field label="Loyalty integration">
        <Switch checked={vs.loyaltyIntegration} onCheckedChange={(v) => setField('loyaltyIntegration', v)} />
      </Field>
    </FormGrid>
  )
}

export function SecuritySection({ vs, setField }: SectionProps) {
  return (
    <FormGrid>
      <Field label="Tokenization provider">
        <SelectField
          value={vs.tokenizationProvider}
          onChange={(v) => setField('tokenizationProvider', v)}
          options={TOKENIZATION_PROVIDERS.map((o) => ({ value: o, label: o }))}
        />
      </Field>
      <Field label="Key encryption method">
        <SelectField
          value={vs.encryption}
          onChange={(v) => setField('encryption', v)}
          options={ENCRYPTION_METHODS.map((o) => ({ value: o, label: o }))}
        />
      </Field>
      <Field label="Key index">
        <Input
          type="number"
          value={vs.keyIndex}
          onChange={(e) => setField('keyIndex', Number(e.target.value))}
          className="font-mono"
        />
      </Field>
      <Field label="TLS version (min)">
        <SelectField
          value={vs.tlsVersion}
          onChange={(v) => setField('tlsVersion', v)}
          options={TLS_VERSIONS.map((o) => ({ value: o, label: `TLS ${o}` }))}
        />
      </Field>
      <Full>
        <Field label="Receipt header">
          <Input
            value={vs.receiptHeader}
            onChange={(e) => setField('receiptHeader', e.target.value)}
            placeholder="Optional — printed at the top of every receipt"
          />
        </Field>
      </Full>
      <Full>
        <Field label="Receipt footer">
          <Input value={vs.receiptFooter} onChange={(e) => setField('receiptFooter', e.target.value)} />
        </Field>
      </Full>
    </FormGrid>
  )
}
