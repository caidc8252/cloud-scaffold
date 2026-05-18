'use client'

import { useState, type KeyboardEvent } from 'react'
import { Check, Plus, X } from 'lucide-react'
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
import type { Merchant } from '../data/types'

export interface MerchantFormPayload {
  name: string
  country: string
  tags: string[]
  notes: string
}

interface MerchantFormModalProps {
  open: boolean
  mode: 'new' | 'edit'
  merchant?: Merchant | null
  onClose: () => void
  onSave: (payload: MerchantFormPayload) => void
}

export function MerchantFormModal({ open, mode, merchant, onClose, onSave }: MerchantFormModalProps) {
  const isEdit = mode === 'edit' && !!merchant
  const [name, setName] = useState(merchant?.name ?? '')
  const [country, setCountry] = useState(merchant?.country ?? COUNTRIES[0])
  const [tags, setTags] = useState<string[]>(merchant?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [notes, setNotes] = useState(merchant?.notes ?? '')

  const canSave = name.trim().length > 1 && tags.length <= 5

  const addTag = () => {
    const v = tagInput.trim()
    if (!v || tags.includes(v) || tags.length >= 5) {
      setTagInput('')
      return
    }
    setTags([...tags, v])
    setTagInput('')
  }

  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-xl"
      title={isEdit ? `Edit ${merchant.name}` : 'New merchant'}
      description={
        isEdit
          ? "Update the merchant's account information. A default headquarter store was created on registration; manage stores under the Stores tab."
          : 'Register a new merchant. A default headquarter store will be created automatically — you can break it out as its own row later by adding a second store.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            iconLeft={isEdit ? <Check size={14} /> : <Plus size={14} />}
            onClick={() => onSave({ name: name.trim(), country, tags, notes })}
          >
            {isEdit ? 'Save changes' : 'Create merchant'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Merchant name"
          required
          hint={
            <span>
              <span className="font-mono">{name.length}</span> / 80 characters
            </span>
          }
          htmlFor="merchant-name"
        >
          <Input
            id="merchant-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            placeholder="e.g. Riverside Coffee Co."
          />
        </Field>

        <Field label="Country / region" required htmlFor="merchant-country">
          <Select value={country} onValueChange={(v) => v && setCountry(v)}>
            <SelectTrigger id="merchant-country">
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

        <Field
          label="Tags"
          hint={
            <span>
              <span className="font-mono">{tags.length}</span> / 5 — optional. Press Enter to add.
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-1 p-1.5 px-2 min-h-9 rounded-md border border-line-default bg-surface-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11.5px] font-medium"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="p-0.5 rounded-full cursor-pointer hover:bg-primary-100"
                  aria-label={`Remove ${t}`}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKey}
                placeholder={tags.length === 0 ? 'Add a tag and press Enter' : 'Add another…'}
                className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-[12.5px] text-content-primary placeholder:text-content-tertiary"
              />
            )}
          </div>
        </Field>

        <Field label="Notes" htmlFor="merchant-notes">
          <Textarea
            id="merchant-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional — primary contact, SLA, special arrangements, etc."
          />
        </Field>
      </div>
    </Modal>
  )
}
