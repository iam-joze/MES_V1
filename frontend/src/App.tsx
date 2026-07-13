import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './consoles/auth/LoginPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { ComingSoon } from './shared/components/ComingSoon';
import { MinimalConsoleShell } from './shared/components/MinimalConsoleShell';
import { ExecutiveShell } from './consoles/executive/ExecutiveShell';
import { ManagerShell } from './consoles/manager/managerShell';
import { Operations } from './consoles/manager/pages/Operations';
import { BlueprintLibrary } from './consoles/manager/pages/BlueprintLibrary';
import JobBuilder from './consoles/manager/pages/JobBuilder';
import { EnterpriseOverview } from './consoles/executive/pages/EnterpriseOverview';
import { ManagerAccounts } from './consoles/executive/pages/ManagerAccounts';
import { ProductionLines } from './consoles/executive/pages/ProductionLines';
import { ActiveJobs } from './consoles/executive/pages/ActiveJobs';
import { OperatorRoster } from './consoles/manager/pages/OperatorRoster';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute role="EXECUTIVE" />}>
        <Route path="/executive" element={<ExecutiveShell />}>
          <Route index element={<EnterpriseOverview />} />
          <Route path="managers" element={<ManagerAccounts />} />
          <Route path="lines" element={<ProductionLines />} />
          <Route path="jobs" element={<ActiveJobs />} />
          <Route path="analytics" element={<ComingSoon title="Historical Analytics" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="MANAGER" />}>
        <Route path="/manager" element={<ManagerShell />}>
          <Route index element={<Operations />} />
          <Route path="blueprints" element={<BlueprintLibrary />} />
          <Route path="job-builder" element={<JobBuilder />} />
          <Route path="operator-roster" element={<OperatorRoster />} />
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
