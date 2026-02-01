import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar'
import { CashflowUpdateForm } from '@/components/cashflow-update-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useCashflowStore } from '@/lib/store'
import { toast } from 'sonner'

export default function UpdatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [manualSelection, setManualSelection] = useState<string | null>(null)
  const cashflows = useCashflowStore((state) => state.cashflows)
  const fetchCashflows = useCashflowStore((state) => state.fetchCashflows)
  const isLoading = useCashflowStore((state) => state.isLoading)
  const routeState = location.state as { cashflowId?: string } | null
  const routeCashflowId = routeState?.cashflowId ?? null

  useEffect(() => {
    let active = true

    fetchCashflows().catch((error) => {
      if (!active) return
      const description =
        error instanceof Error
          ? error.message
          : 'Unable to load your cashflows.'
      toast.error('Error', { description })
    })

    return () => {
      active = false
    }
  }, [fetchCashflows])

  const selectedId = useMemo(() => {
    const preferredId = manualSelection ?? routeCashflowId
    if (preferredId && cashflows.some((cf) => cf.id === preferredId)) {
      return preferredId
    }
    return cashflows[0]?.id ?? null
  }, [manualSelection, routeCashflowId, cashflows])

  const selectedCashflow = selectedId
    ? cashflows.find((cf) => cf.id === selectedId) ?? null
    : null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Update Cashflow</h1>
            <p className="text-muted-foreground mt-2">Edit an existing cashflow entry</p>
          </div>

          {isLoading && cashflows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading cashflows...
            </div>
          ) : cashflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No cashflows to update</p>
              <Button onClick={() => navigate('/create')}>
                Create First Cashflow
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <h2 className="font-semibold mb-4 text-foreground">Select Cashflow</h2>
                <div className="space-y-2">
                  {cashflows.map((cf) => (
                    <button
                      key={cf.id}
                      onClick={() => setManualSelection(cf.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedId === cf.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{cf.name}</div>
                      <div className="text-sm opacity-75">{cf.category}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-3">
                {selectedCashflow && (
                  <CashflowUpdateForm
                    key={selectedCashflow.id}
                    cashflow={selectedCashflow}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}