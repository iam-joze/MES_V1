import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './consoles/auth/LoginPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { ComingSoon } from './shared/components/ComingSoon';
import { MinimalConsoleShell } from './shared/components/MinimalConsoleShell';
import { ExecutiveShell } from './consoles/executive/ExecutiveShell';
import { EnterpriseOverview } from './consoles/executive/pages/EnterpriseOverview';
import { OperatorShell } from './consoles/operator/OperatorShell';
import { AssignedProcessList } from './consoles/operator/pages/AssignedProcessList';
import { ProcessRuntimeView } from './consoles/operator/pages/ProcessRuntimeView';

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
        <Route path="/manager" element={<MinimalConsoleShell consoleName="Manager Console" />} />
      </Route>

      <Route element={<ProtectedRoute role="OPERATOR" />}>
        <Route path="/operator" element={<OperatorShell />}>
          <Route index element={<AssignedProcessList />} />
          <Route path="process/:id" element={<ProcessRuntimeView />} />
          <Route path="settings" element={<ComingSoon title="Account / PIN Settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;