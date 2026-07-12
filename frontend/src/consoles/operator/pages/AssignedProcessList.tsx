import { useNavigate } from 'react-router-dom';
import { LayoutGrid, User, Settings, ClipboardList } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { mockAssignedEntries } from '../data/mockOperatorData';
import { ProcessEntryCard } from '../components/ProcessEntryCard';

// O1. Assigned Process List — UI Brief §5.3, SRS 4.3.1
export function AssignedProcessList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const entries = mockAssignedEntries;
  const activeCount = entries.filter((e) => e.status !== 'COMPLETED').length;

  return (
    <div className="pb-8">
      {/* Header: operator name + account/settings icons, routes to O5 */}
      <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
            <LayoutGrid size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-navy-900 leading-tight">Dojo Hub</h1>
            <p className="text-sm text-slate-500 leading-tight">{user?.name ?? 'Operator'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Account"
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <User size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => navigate('/operator/settings')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Settings size={18} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">My Assignments</h2>
          <span className="text-base text-slate-500">{activeCount} active</span>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ClipboardList size={28} className="text-slate-400" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No assignments yet</h3>
            <p className="text-base text-slate-500 max-w-xs">
              You'll see your process entries here as soon as a manager assigns them to you.
            </p>
          </div>
        ) : (
          entries.map((entry) => <ProcessEntryCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}