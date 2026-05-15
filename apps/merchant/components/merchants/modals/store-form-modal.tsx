'use client'

import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@cloud/ui'
import { COUNTRIES } from '../data/constants'
import type { Merchant, Store } from '../data/types'

export interface StoreFormPayload {
  name: string
  address: string
  country: string
  notes: string
}

interface StoreFormModalProps {
  open: boolean
  mode: 'new' | 'edit'
  merchant: Merchant
  store?: Store
  onClose: () => void
  onSave: (payload: StoreFormPayload) => void
  onDelete?: (store: Store) => void
}

export function StoreFormModal({ open, mode, merchant, store, onClose, onSave, onDelete }: StoreFormModalProps) {
  const isEdit = mode === 'edit' && !!store
  const isHQ = store?.isHQ
  const [name, setName] = useState(store?.name ?? (isHQ ? merchant.name : ''))
  const [address, setAddress] = useState(store?.address ?? '')
  const [country, setCountry] = useState(store?.country ?? merchant.country)
  const [notes, setNotes] = useState(store?.notes ?? '')

  const canSave = name.trim().length > 1

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-xl"
      title={isEdit ? (isHQ ? 'Edit headquarter' : `Edit ${store.name}`) : 'Add store'}
      description={
        isEdit
          ? isHQ
            ? "The headquarter is the auto-created store every merchant has. You can rename it, but it can't be deleted."
            : "Update this store's details."
          : 'Adding a second store makes the headquarter visible as its own row. Terminals stay with their currently-bound store.'
      }
      footer={
        <>
          {isEdit && !isHQ && onDelete && (
            <Button variant="destructive" iconLeft={<Trash2 size={14} />} onClick={() => onDelete(store)}>
              Delete store
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            iconLeft={isEdit ? <Check size={14} /> : <Plus size={14} />}
            onClick={() => onSave({ name: name.trim(), address: address.trim(), country, notes })}
          >
            {isEdit ? 'Save changes' : 'Add store'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field
          label="Store name"
          required
          hint={
            isHQ ? (
              <>
                Defaults to the merchant name. Rename if the headquarter has its own street identity.{' '}
                <span className="font-mono">{name.length}</span> / 80 characters.
              </>
            ) : (
              <span>
                <span className="font-mono">{name.length}</span> / 80 characters
              </span>
            )
          }
          htmlFor="store-name"
        >
          <Input
            id="store-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            placeholder={isHQ ? merchant.name : 'e.g. Plateau Roastery'}
          />
        </Field>

        <Field label="Store address" htmlFor="store-address">
          <Input
            id="store-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, postal code"
          />
        </Field>

        <Field label="Country / region" required htmlFor="store-country">
          <Select value={country} onValueChange={(v) => v && setCountry(v)}>
            <SelectTrigger id="store-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Notes" htmlFor="store-notes">
          <Textarea
            id="store-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional — operating hours, contact, etc."
          />
        </Field>
      </div>
    </Modal>
  )
}
