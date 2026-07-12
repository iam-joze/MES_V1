import { Outlet } from 'react-router-dom';

// UI Brief §5.3 (O1): "no side navigation (Operator lane has minimal navigation
// depth by design)". Each page owns its own header (O1's account bar vs O2's
// back/status bar), so this shell is intentionally just a mobile-width frame —
// no persistent chrome like ManagerShell/ExecutiveShell have.
export function OperatorShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative">
        <Outlet />
      </div>
    </div>
  );
}