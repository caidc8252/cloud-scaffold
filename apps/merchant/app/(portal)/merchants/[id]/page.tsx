import { notFound } from 'next/navigation'
import { findMerchant } from '@/components/merchants/data/helpers'
import { MerchantDetail } from '@/components/merchants/detail/merchant-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MerchantDetailPage({ params }: PageProps) {
  const { id } = await params
  const merchant = findMerchant(id)
  if (!merchant) notFound()
  return <MerchantDetail initialMerchant={merchant} />
}
