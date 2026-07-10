import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './consoles/auth/LoginPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { ComingSoon } from './shared/components/ComingSoon';
import { ExecutiveShell } from './consoles/executive/ExecutiveShell';
import { EnterpriseOverview } from './consoles/executive/pages/EnterpriseOverview';
import { ManagerShell } from './consoles/manager/ManagerShell';
import ManagerHome from './consoles/manager/pages/ManagerHome';
import BlueprintCatalog from './consoles/manager/pages/BlueprintCatalog';
import JobBuilder from './consoles/manager/pages/JobBuilder';
import { MinimalConsoleShell } from './shared/components/MinimalConsoleShell';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute role="EXECUTIVE" />}>
        <Route path="/executive" element={<ExecutiveShell />}>
          <Route index element={<EnterpriseOverview />} />
          <Route path="managers" element={<ComingSoon title="Manager Accounts" />} />
          <Route path="lines" element={<ComingSoon title="Production Lines" />} />
          <Route path="jobs" element={<ComingSoon title="Active Jobs" />} />
          <Route path="analytics" element={<ComingSoon title="Historical Analytics" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="MANAGER" />}>
        <Route path="/manager" element={<ManagerShell />}>
          <Route index element={<ManagerHome />} />
          <Route path="blueprints" element={<BlueprintCatalog />} />
          <Route path="jobs" element={<JobBuilder />} />
          {/* TODO: swap these for the real screens once M5 (Operator Roster)
              and M4a (Fault Detail/Resolve) are built */}
          <Route path="roster" element={<ComingSoon title="Operator Roster" />} />
          <Route path="faults" element={<ComingSoon title="Fault Records" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="OPERATOR" />}>
        <Route path="/operator" element={<MinimalConsoleShell consoleName="Operator Console" />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;