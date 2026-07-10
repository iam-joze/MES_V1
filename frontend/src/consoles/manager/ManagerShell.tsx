import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Factory,
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  AlertTriangle,
  Search,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/* ---------------------------------------------------------------------
   Manager Shell
   Mirrors consoles/executive/ExecutiveShell.tsx exactly: same sidebar
   width/colors, same NavLink active-state classes, same auth wiring.
   The header keeps Manager-specific content (search + Emergency Stop)
   instead of Executive's welcome message, since those are genuine
   per-console needs, but uses the same container classes.
--------------------------------------------------------------------- */

const navItems = [
  { to: '/manager', label: 'Operations', icon: <LayoutDashboard size={20} strokeWidth={2.5} />, end: true },
  { to: '/manager/blueprints', label: 'Blueprint Library', icon: <FileText size={20} strokeWidth={2.5} /> },
  { to: '/manager/jobs', label: 'Job Builder', icon: <Briefcase size={20} strokeWidth={2.5} /> },
  { to: '/manager/roster', label: 'Operator Roster', icon: <Users size={20} strokeWidth={2.5} /> },
  { to: '/manager/faults', label: 'Fault Records', icon: <AlertTriangle size={20} strokeWidth={2.5} /> },
];

export function ManagerShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [stopArmed, setStopArmed] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(1); // TODO: derive from real fault/alert data

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen flex bg-slate-50">
      <aside className="w-64 bg-navy-950 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Factory size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Dojo Hub Uganda</h1>
              <p className="text-xs text-slate-400 leading-tight">Manager Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-navy-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut size={20} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, operators, or faults..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setStopArmed(true)}
              disabled={stopArmed}
              className="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-xs font-bold tracking-wide text-white transition-colors hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AlertTriangle size={16} strokeWidth={2.5} />
              {stopArmed ? 'EMERGENCY STOP ACTIVE' : 'EMERGENCY STOP'}
            </button>

            <button
              onClick={() => setUnreadAlerts(0)}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell size={20} strokeWidth={2.5} />
              {unreadAlerts > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                {user?.name?.charAt(0) ?? 'M'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-800">{user?.name ?? 'Manager'}</p>
                <p className="text-xs leading-tight text-slate-500">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Emergency stop banner — reachable from anywhere in the Manager lane */}
        {stopArmed && (
          <div className="flex shrink-0 items-center justify-between gap-3 bg-danger-600 px-6 py-2.5 text-sm font-medium text-white">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={16} strokeWidth={2.5} />
              Emergency Stop active — triggered by {user?.name ?? 'you'}
            </span>
            <button
              onClick={() => setStopArmed(false)}
              className="rounded-md bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
            >
              Resume
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}