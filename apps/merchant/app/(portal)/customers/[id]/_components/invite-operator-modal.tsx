'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Mail, Link as LinkIcon, Copy, Check, Info } from 'lucide-react'
import { Button, Modal, Input, Field } from '@cloud/ui'
import { type Operator } from '@/lib/data/customers'

interface InviteOperatorModalProps {
  open: boolean
  onClose: () => void
  onInvite: (op: Operator) => void
}

type Method = 'link' | 'email'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function randomToken(len: number) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export function InviteOperatorModal({ open, onClose, onInvite }: InviteOperatorModalProps) {
  const [method, setMethod] = useState<Method>('link')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setMethod('link')
      setEmail('')
      setCopied(false)
    }
  }, [open])

  const inviteUrl = useMemo(
    () => `https://app.carbon.toms/invite/${randomToken(8)}-${randomToken(4)}`,
    // open is the seed — regenerate per open
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  )

  const expires = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const validEmail = EMAIL_RE.test(email)

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).catch(() => undefined)
    }
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 1800)
  }

  const handleLinkDone = () => {
    onInvite({
      name: '',
      email: '',
      phone: '',
      role: 'Operator',
      lastLogin: null,
      pending: true,
    })
    onClose()
  }

  const handleEmailSend = () => {
    if (!validEmail) return
    onInvite({
      name: '',
      email: email.trim(),
      phone: '',
      role: 'Operator',
      lastLogin: null,
      pending: true,
    })
    toast.success('Activation email sent', { description: `Sent to ${email.trim()}` })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite operator"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {method === 'link' ? (
            <Button variant="primary" onClick={handleLinkDone}>Done</Button>
          ) : (
            <Button variant="primary" disabled={!validEmail} onClick={handleEmailSend}>
              <Mail size={13} /> Send invite
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-1 rounded-lg border border-line-default bg-surface-3 p-1 self-start">
          <button
            type="button"
            onClick={() => setMethod('link')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              method === 'link'
                ? 'bg-surface-2 text-content-primary shadow-1'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            <LinkIcon size={13} /> Share a link
          </button>
          <button
            type="button"
            onClick={() => setMethod('email')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              method === 'email'
                ? 'bg-surface-2 text-content-primary shadow-1'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            <Mail size={13} /> Email invite
          </button>
        </div>

        {method === 'link' ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-medium text-content-secondary mb-1.5">One-time invite link</div>
              <div className="flex items-center gap-2 rounded-lg border border-line-default bg-surface-2 px-3 py-2">
                <LinkIcon size={14} className="text-content-tertiary shrink-0" />
                <span className="flex-1 min-w-0 truncate font-mono text-xs text-content-primary">{inviteUrl}</span>
                <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </Button>
              </div>
              <div className="text-xs text-content-tertiary mt-1.5">Expires {expires} · single use.</div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border border-line-subtle bg-surface-3 p-3">
              <QRPlaceholder seed={inviteUrl} />
              <div>
                <div className="text-sm font-medium text-content-primary mb-1">Or scan the QR code</div>
                <div className="text-xs text-content-secondary leading-relaxed">
                  The recipient will set their password and enroll 2FA before first login.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Operator email address" required hint="Activation link is valid for 7 days.">
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <div className="flex items-start gap-2 rounded-lg border border-line-subtle bg-surface-3 p-3">
              <Info size={14} className="text-content-tertiary shrink-0 mt-0.5" />
              <span className="text-xs text-content-secondary leading-relaxed">
                The recipient receives a one-time activation link and must enroll 2FA before first login.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function QRPlaceholder({ seed }: { seed: string }) {
  const cells: boolean[] = []
  for (let i = 0; i < 11 * 11; i++) {
    const x = i % 11
    const y = Math.floor(i / 11)
    const ch = seed.charCodeAt(i % seed.length) || 0
    const filled =
      ((x * 7 + y * 13 + ch) % 3) === 0 ||
      (x < 3 && y < 3) ||
      (x > 7 && y < 3) ||
      (x < 3 && y > 7)
    cells.push(filled)
  }
  return (
    <svg width="84" height="84" viewBox="0 0 92 92" aria-hidden className="shrink-0 rounded-sm bg-white">
      <rect width="92" height="92" fill="#fff" />
      {cells.map((on, i) => {
        if (!on) return null
        const x = i % 11
        const y = Math.floor(i / 11)
        return <rect key={i} x={6 + x * 7} y={6 + y * 7} width="6" height="6" fill="#18181B" />
      })}
      <rect x="6" y="6" width="20" height="20" fill="none" stroke="#18181B" strokeWidth="2" />
      <rect x="66" y="6" width="20" height="20" fill="none" stroke="#18181B" strokeWidth="2" />
      <rect x="6" y="66" width="20" height="20" fill="none" stroke="#18181B" strokeWidth="2" />
    </svg>
  )
}
