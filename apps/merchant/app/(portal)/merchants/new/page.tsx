'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MerchantFormModal } from '@/components/merchants/modals/merchant-form-modal'

export default function NewMerchantPage() {
  const router = useRouter()

  return (
    <MerchantFormModal
      open
      mode="new"
      onClose={() => router.push('/merchants')}
      onSave={(payload) => {
        toast.success(`${payload.name} created · default headquarter store added`)
        router.push('/merchants')
      }}
    />
  )
}
