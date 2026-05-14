import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog"

interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlay?: boolean
  showCloseButton?: boolean
  children?: React.ReactNode
  className?: string
}

// Centered overlay dialog with flat props. title/description populate the header; footer renders an action bar.
// showCloseButton (default true) shows X icon in corner. closeOnOverlay (default true) dismisses on backdrop click.
function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  closeOnOverlay: _closeOnOverlay = true,
  showCloseButton = true,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && onClose) onClose()
      }}
    >
      <DialogContent showCloseButton={showCloseButton} className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export { Modal, type ModalProps }
