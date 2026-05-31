import { Sidebar } from './sidebar'
import { Header } from './header'
import { FloatingActionButton } from './floating-action-button'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="w-full lg:ml-64 flex flex-col">
        {/* Header */}
        <Header />

        {/* Content area */}
        <main className="flex-1 overflow-auto lg:mt-16 pt-16 lg:pt-0">
          <div className="min-h-full p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Floating action button for mobile */}
      <FloatingActionButton />
    </div>
  )
}
