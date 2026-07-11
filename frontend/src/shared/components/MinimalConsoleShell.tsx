import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ComingSoon } from './ComingSoon';

export function MinimalConsoleShell({ consoleName }: { consoleName: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
            <img src="/dojohub_icon.png" alt="Dojo Hub Uganda logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Dojo Hub Uganda</p>
            <p className="text-xs text-slate-500 leading-tight">{consoleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.name}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </header>
      <main className="p-6">
        <ComingSoon title={`${consoleName} — coming soon`} />
      </main>
    </div>
  );
}
