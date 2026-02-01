import { Sidebar } from '@/components/sidebar'
import { CashflowForm } from '@/components/cashflow-form'

export default function CreatePage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Create Cashflow</h1>
            <p className="text-muted-foreground mt-2">Add a new cashflow entry to your records</p>
          </div>
          <CashflowForm />
        </div>
      </main>
    </div>
  )
}