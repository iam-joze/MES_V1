import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProductionOverview } from './components/ProductionOverview';
import { AlertFeed } from './components/AlertFeed';
import { OperatorRoster } from './components/OperatorRoster';
import { BlueprintManagement } from './components/BlueprintManagement';
import { JobBuilder } from './components/JobBuilder';
import { OperatorDirectory } from './components/OperatorDirectory';
import { FaultRecordsView } from './components/FaultRecordsView';
import { FaultResolutionModal } from './components/FaultResolutionModal';
import { EmergencyStopFlow } from './components/EmergencyStopFlow';
import { UnifiedLogin } from './components/UnifiedLogin';
import type { AuthRole } from './components/UnifiedLogin';
import { OperatorHome } from './components/OperatorHome';
import { OperatorRuntime } from './components/OperatorRuntime';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { TestHelperOverlay } from './components/TestHelperOverlay';
import { LiveJobMonitor } from './components/LiveJobMonitor';
import { ManagerHome } from './components/ManagerHome';
import { mockKPI, mockJobs, mockAlerts, mockOperators } from './data/mockData';
import type { Alert, Operator } from './types';
import type { OperatorProcessStage } from './types/operatorModule';

function App() {
  const [activeNav, setActiveNav] = useState('operations');
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [operators, setOperators] = useState<Operator[]>(mockOperators);

  // Fault resolution modal state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);

  // Emergency stop flow state
  const [isEmergencyStopOpen, setIsEmergencyStopOpen] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // Gatekeeper auth state
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [authOperatorName, setAuthOperatorName] = useState<string | undefined>(undefined);
  const [authManagerId, setAuthManagerId] = useState<string | undefined>(undefined);
  const [selectedStage, setSelectedStage] = useState<OperatorProcessStage | null>(null);

  const handleEmergencyStop = () => {
    setIsEmergencyStopOpen(true);
  };

  const handleOpenFaultModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsFaultModalOpen(true);
  };

  const handleFaultResolutionSubmit = (resolution: {
    alertId: string;
    choice: 'dismiss_log' | 'pause_process' | 'emergency_stop';
    notes: string;
  }) => {
    // In a real app, this would call the backend
    setAlerts(prev => prev.filter(a => a.id !== resolution.alertId));

    if (resolution.choice === 'emergency_stop') {
      setIsEmergencyActive(true);
    }
  };

  const handleEmergencyActivate = (
    _scope: 'facility_wide' | 'specific_job',
    _reason: string,
    _notes: string,
    isActive: boolean
  ) => {
    setIsEmergencyActive(isActive);
  };

  const handleResolveAlert = (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      handleOpenFaultModal(alert);
    }
  };

  const handleReassignOperator = (id: string, newAssignment: string) => {
    setOperators(prev =>
      prev.map(op =>
        op.id === id ? { ...op, activeAssignment: newAssignment } : op
      )
    );
  };

  const renderMainContent = () => {
    if (isEmergencyActive) {
      return (
        <div className="h-full flex items-center justify-center bg-danger-50">
          <div className="text-center p-12">
            <div className="w-32 h-32 bg-danger-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-danger-600 text-5xl font-bold">!</span>
            </div>
            <h2 className="text-3xl font-bold text-danger-800 mb-2">EMERGENCY HALT ACTIVE</h2>
            <p className="text-danger-600">Production is suspended. Click "Authorize Resumption" in the banner to lift the halt.</p>
          </div>
        </div>
      );
    }

    switch (activeNav) {
      case 'blueprints':
        return (
          <div className="h-full overflow-hidden">
            <BlueprintManagement />
          </div>
        );
      case 'job-builder':
        return (
          <div className="h-full overflow-hidden">
            <JobBuilder managerId={authManagerId} managerName={authOperatorName} />
          </div>
        );
      case 'operator-roster':
        return (
          <div className="h-full overflow-hidden">
            <OperatorDirectory />
          </div>
        );
      case 'faults':
        return (
          <div className="h-full overflow-hidden">
            <FaultRecordsView />
          </div>
        );
      case 'operations':
      default:
        return (
          <div className="h-full overflow-hidden">
            <ManagerHome managerId={authManagerId} managerName={authOperatorName} onNavigate={setActiveNav} />
          </div>
        );
    }
  };

  // Gatekeeper: if not authenticated, show login
  if (!authRole) {
    return <UnifiedLogin onAuthenticate={(role, operatorName, accountId) => { setAuthRole(role); setAuthOperatorName(operatorName); setAuthManagerId(accountId); }} />;
  }

  // Operator role: render mobile operator module (O1/O2)
  if (authRole === 'operator') {
    if (selectedStage) {
      return (
        <OperatorRuntime
          stageId={selectedStage.id}
          onBack={() => setSelectedStage(null)}
        />
      );
    }
    return (
      <OperatorHome
        operatorName={authOperatorName || 'Wasswa Job'}
        onSelectStage={(stage) => setSelectedStage(stage)}
      />
    );
  }

  // Executive role: render Executive Strategic Dashboard (E1)
  if (authRole === 'executive') {
    return <ExecutiveDashboard onSignOut={() => setAuthRole(null)} />;
  }

  // Manager role: render Manager Central Operations Dashboard (M1) — existing platform
  return (
    <div className="h-screen flex bg-slate-100">
      {/* Sidebar */}
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onEmergencyStop={handleEmergencyStop} userName={authOperatorName} userRole="Manager" />

        {/* Main Dashboard Grid */}
        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>

        {/* Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Dojo Hub Uganda MES v2.4.1</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Last sync: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isEmergencyActive ? 'bg-danger-500' : 'bg-success-500'}`} />
            <span className={`text-xs ${isEmergencyActive ? 'text-danger-600 font-semibold' : 'text-slate-500'}`}>
              {isEmergencyActive ? 'HALTED' : 'System Online'}
            </span>
          </div>
        </footer>
      </div>

      {/* Fault Resolution Modal */}
      <FaultResolutionModal
        alert={selectedAlert}
        isOpen={isFaultModalOpen}
        onClose={() => {
          setIsFaultModalOpen(false);
          setSelectedAlert(null);
        }}
        onSubmit={handleFaultResolutionSubmit}
      />

      {/* Emergency Stop Flow */}
      <EmergencyStopFlow
        isOpen={isEmergencyStopOpen}
        onClose={() => setIsEmergencyStopOpen(false)}
        onActivate={handleEmergencyActivate}
      />

      {/* System Validation & Integration Test Panel */}
      <TestHelperOverlay />
    </div>
  );
}

export default App;
