import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import SideNav             from './components/SideNav'
import BottomNav           from './components/BottomNav'
import BroadcastBanner     from './components/BroadcastBanner'
import NotificationToast   from './components/NotificationToast'
import OfflineBanner       from './components/OfflineBanner'
import LowPowerBanner      from './components/LowPowerMode'
import FeatureTour         from './components/FeatureTour'
import { useGeofence }     from './hooks/useGeofence'
import Home                from './pages/Home'
import SOS                 from './pages/SOS'
import MapView             from './pages/MapView'
import Reports             from './pages/Reports'
import NewReport           from './pages/NewReport'
import Profile             from './pages/Profile'
import Auth                from './pages/Auth'
import Helplines           from './pages/Helplines'
import Chat                from './pages/Chat'
import Broadcasts          from './pages/Broadcasts'
import AdminDashboard      from './pages/AdminDashboard'
import AIDamageAssessment  from './pages/AIDamageAssessment'
import RescueDashboard     from './pages/RescueDashboard'
import EarlyWarning        from './pages/EarlyWarning'
import EmergencyPlan       from './pages/EmergencyPlan'
import ResourceInventory   from './pages/ResourceInventory'

function UserShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { showTour, setShowTour } = useApp()

  // Background geofence watcher — fires in-app alerts when user enters a risk zone
  useGeofence()

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Feature tour — only for guests and new registrations */}
      {showTour && <FeatureTour onDismiss={() => setShowTour(false)} />}

      {/* Sidebar — hidden on mobile, visible md+ */}
      <SideNav collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top banners */}
        <LowPowerBanner />
        <OfflineBanner />
        <BroadcastBanner />
        <NotificationToast />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto thin-scrollbar">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6 lg:px-8">
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/sos"            element={<SOS />} />
              <Route path="/map"            element={<MapView />} />
              <Route path="/reports"        element={<Reports />} />
              <Route path="/reports/new"    element={<NewReport />} />
              <Route path="/profile"        element={<Profile />} />
              <Route path="/helplines"      element={<Helplines />} />
              <Route path="/chat"           element={<Chat />} />
              <Route path="/broadcasts"     element={<Broadcasts />} />
              <Route path="/ai-damage"      element={<AIDamageAssessment />} />
              <Route path="/rescue"         element={<RescueDashboard />} />
              <Route path="/early-warning"   element={<EarlyWarning />} />
              <Route path="/emergency-plan"  element={<EmergencyPlan />} />
              <Route path="/inventory"       element={<ResourceInventory />} />
              <Route path="*"               element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Bottom nav — mobile only */}
        <BottomNav />
      </div>
    </div>
  )
}

function AdminShell() {
  return (
    <div className="flex h-full">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl">
          <NotificationToast />
          <Routes>
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function AppShell() {
  const { user } = useApp()
  if (!user) return <Auth />
  if (user.role === 'admin') return <AdminShell />
  return <UserShell />
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  )
}
