import Sidebar from '@/components/Sidebar'
import Protected from '@/components/Protected' // <-- 1. Impor komponen

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* 2. Bungkus children dengan Protected */}
        <Protected>
          {children}
        </Protected>
      </main>
    </div>
  )
}