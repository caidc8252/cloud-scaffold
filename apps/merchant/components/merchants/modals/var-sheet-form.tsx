'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cloud/ui'
import type { Store } from '../data/types'
import {
  AcquirerSection,
  CardsSection,
  FeaturesSection,
  IdentitySection,
  OpsSection,
  SecuritySection,
  VAR_SHEET_SECTIONS,
  type VarSheetSectionId,
} from './var-sheet-sections'
import type { VarSheetState } from './var-sheet-state'

interface VarSheetFormProps {
  stores: Store[]
  vs: VarSheetState
  setField: <K extends keyof VarSheetState>(key: K, value: VarSheetState[K]) => void
}

export function VarSheetForm({ stores, vs, setField }: VarSheetFormProps) {
  const [section, setSection] = useState<VarSheetSectionId>('identity')
  const selectedStore = stores.find((s) => s.id === vs.storeId)

  return (
    <Tabs value={section} onValueChange={(v) => setSection(v as VarSheetSectionId)}>
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        {VAR_SHEET_SECTIONS.map((s) => (
          <TabsTrigger key={s.id} value={s.id}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="max-h-[420px] overflow-y-auto pr-1 pt-2">
        <TabsContent value="identity">
          <IdentitySection vs={vs} setField={setField} selectedStore={selectedStore} />
        </TabsContent>
        <TabsContent value="acquirer">
          <AcquirerSection vs={vs} setField={setField} />
        </TabsContent>
        <TabsContent value="ops">
          <OpsSection vs={vs} setField={setField} />
        </TabsContent>
        <TabsContent value="cards">
          <CardsSection vs={vs} setField={setField} />
        </TabsContent>
        <TabsContent value="features">
          <FeaturesSection vs={vs} setField={setField} />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySection vs={vs} setField={setField} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
