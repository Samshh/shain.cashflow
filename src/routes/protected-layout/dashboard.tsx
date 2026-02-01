import { Sidebar } from '@/components/sidebar'
import { CashflowDashboard } from '@/components/cashflow-dashboard'

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <CashflowDashboard />
      </main>
    </div>
  )
}