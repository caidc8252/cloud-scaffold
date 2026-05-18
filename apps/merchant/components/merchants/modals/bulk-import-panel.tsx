'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Upload } from 'lucide-react'
import { Alert, AlertDescription, Button, Spinner } from '@cloud/ui'
import type { Merchant, Store } from '../data/types'

export interface BulkImportRow {
  row: number
  storeId: string
  address: string
  mcc: string
  currency: string
  schemes: string
  valid: boolean
  error?: string
}

interface BulkImportPanelProps {
  merchant: Merchant
  stores: Store[]
  onCommit: (rows: BulkImportRow[]) => void
}

const MOCK_ROWS = (storeId: string): BulkImportRow[] => [
  { row: 1, storeId, address: '402 St-Laurent Blvd, Montréal, QC', mcc: '5812', currency: 'CAD', schemes: 'Visa, Mastercard, Interac', valid: true },
  { row: 2, storeId, address: '5640 Av du Parc, Montréal, QC', mcc: '5812', currency: 'CAD', schemes: 'Visa, Mastercard, AMEX', valid: true },
  { row: 3, storeId, address: '10 Rue de la Commune E, Montréal', mcc: '5499', currency: 'CAD', schemes: 'Visa, Mastercard', valid: true },
  { row: 4, storeId, address: '', mcc: '5812', currency: 'CAD', schemes: 'Visa, Mastercard', valid: false, error: 'Missing address' },
  { row: 5, storeId, address: '1234 17 Ave SW, Calgary', mcc: '', currency: 'CAD', schemes: 'Visa', valid: false, error: 'Missing MCC' },
  { row: 6, storeId, address: '92 Bloor St W, Toronto', mcc: '5942', currency: 'CAD', schemes: 'Visa, Mastercard, AMEX, Interac', valid: true },
]

type Phase = 'idle' | 'parsing' | 'parsed'

export function BulkImportPanel({ merchant, stores, onCommit }: BulkImportPanelProps) {
  const hq = stores.find((s) => s.isHQ) ?? stores[0]
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [rows, setRows] = useState<BulkImportRow[]>([])

  const valid = rows.filter((r) => r.valid).length
  const invalid = rows.length - valid

  const onFile = (file: File) => {
    setFileName(file.name)
    setPhase('parsing')
    window.setTimeout(() => {
      setRows(MOCK_ROWS(hq?.id ?? merchant.stores[0]?.id ?? ''))
      setPhase('parsed')
    }, 700)
  }

  const reset = () => {
    setFileName('')
    setRows([])
    setPhase('idle')
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        <AlertDescription>
          Upload a CSV/XLSX with one VarSheet per row. <Button variant="link">Download template (.xlsx)</Button>. Up to 500
          rows; previews limited to the first 10.
        </AlertDescription>
      </Alert>

      {phase === 'idle' && (
        <label className="flex flex-col items-center justify-center gap-2 py-10 px-4 rounded-lg border border-dashed border-line-strong bg-surface-3 cursor-pointer hover:bg-surface-hover transition-colors">
          <Upload size={28} className="text-content-tertiary" />
          <div className="text-sm font-medium text-content-primary">Drag CSV/XLSX or click to browse</div>
          <div className="text-[11.5px] text-content-tertiary">Up to 500 rows</div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
          />
        </label>
      )}

      {phase === 'parsing' && (
        <div className="flex items-center gap-2 py-8 justify-center text-content-secondary">
          <Spinner size="md" />
          <span className="text-sm">Parsing {fileName}…</span>
        </div>
      )}

      {phase === 'parsed' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <KpiTile label="File" value={fileName} mono small />
            <KpiTile label="Rows" value={rows.length} />
            <KpiTile label="Valid" value={valid} tone="success" />
            <KpiTile label="Errors" value={invalid} tone={invalid > 0 ? 'error' : undefined} />
          </div>

          <div className="rounded-md overflow-hidden border border-line-default">
            <div className="max-h-[260px] overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-surface-3 z-10">
                  <tr>
                    {['Row', 'Address', 'MCC', 'Currency', 'Schemes', 'Valid?'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[10.5px] font-medium uppercase tracking-wider text-content-tertiary border-b border-line-default whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.row}
                      className={`border-b border-line-subtle ${r.valid ? '' : 'bg-error-bg'}`}
                    >
                      <td className="px-3 py-2 font-mono">{r.row}</td>
                      <td className="px-3 py-2">{r.address || <span className="text-content-tertiary">—</span>}</td>
                      <td className="px-3 py-2 font-mono">{r.mcc || '—'}</td>
                      <td className="px-3 py-2 font-mono">{r.currency}</td>
                      <td className="px-3 py-2 text-[11px]">{r.schemes}</td>
                      <td className="px-3 py-2">
                        {r.valid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-success-strong font-medium">
                            <Check size={11} strokeWidth={2.4} /> Valid
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-error-strong font-medium"
                            title={r.error}
                          >
                            <AlertTriangle size={11} /> {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-content-tertiary">
              {invalid > 0
                ? `Fix the highlighted rows in the source file, then re-upload — or click Import valid only to skip them.`
                : `All rows look good. Click Import to create ${valid} pending VarSheet${valid === 1 ? '' : 's'}.`}
            </span>
            <div className="flex-1" />
            <Button variant="ghost" onClick={reset}>
              Replace file
            </Button>
            <Button
              variant="primary"
              iconLeft={<Check size={14} />}
              disabled={valid === 0}
              onClick={() => onCommit(rows.filter((r) => r.valid))}
            >
              {invalid > 0 ? `Import valid only · ${valid}` : `Import · ${valid}`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function KpiTile({
  label,
  value,
  tone,
  mono,
  small,
}: {
  label: string
  value: string | number
  tone?: 'success' | 'error'
  mono?: boolean
  small?: boolean
}) {
  const toneClass =
    tone === 'success' ? 'text-success-strong' : tone === 'error' ? 'text-error-strong' : 'text-content-primary'
  return (
    <div className="px-3 py-2.5 rounded-md bg-surface-2 border border-line-default">
      <div className="text-[10px] uppercase tracking-wider text-content-tertiary font-medium">{label}</div>
      <div
        className={`mt-1 font-medium truncate ${small ? 'text-xs' : 'text-lg'} ${mono ? 'font-mono' : ''} ${toneClass}`}
      >
        {value}
        {value === 0 || value === '' ? <span className="text-content-tertiary">{value === '' ? '—' : ''}</span> : null}
      </div>
    </div>
  )
}

