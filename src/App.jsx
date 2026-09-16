import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SimulationProvider } from './services/store';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import RecoveryActions from './pages/RecoveryActions';
import DecisionEngine from './pages/DecisionEngine';
import ModelMetrics from './pages/ModelMetrics';
import Resources from './pages/Resources';
import AuditTrail from './pages/AuditTrail';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop open" onClick={() => setSidebarOpen(false)} />}
      <div className="main-col">
        <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:incidentId" element={<IncidentDetail />} />
            <Route path="/recovery-actions" element={<RecoveryActions />} />
            <Route path="/decision-engine" element={<DecisionEngine />} />
            <Route path="/model-metrics" element={<ModelMetrics />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/audit-trail" element={<AuditTrail />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </SimulationProvider>
  );
}
