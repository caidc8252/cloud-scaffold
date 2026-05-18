'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button, ContentHeader } from '@cloud/ui'
import { MerchantFormModal } from '@/components/merchants/modals/merchant-form-modal'

export default function NewMerchantPage() {
  const router = useRouter()

  return (
    <div>
      <ContentHeader
        title="New merchant"
        description="Create a merchant account and a default headquarter store."
      >
        <Button variant="ghost" size="md" onClick={() => router.push('/merchants')}>
          <X size={14} /> Cancel
        </Button>
      </ContentHeader>

      <MerchantFormModal
        open
        mode="new"
        onClose={() => router.push('/merchants')}
        onSave={(payload) => {
          toast.success(`${payload.name} created · default headquarter store added`)
          router.push('/merchants')
        }}
      />
    </div>
  )
}
