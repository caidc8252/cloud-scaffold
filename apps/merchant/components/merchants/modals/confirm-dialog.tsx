'use client'

import { Button, Modal } from '@cloud/ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  body?: React.ReactNode
  confirmLabel: string
  confirmDisabled?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  body,
  confirmLabel,
  confirmDisabled,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-md"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  )
}
