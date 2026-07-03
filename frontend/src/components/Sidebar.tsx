import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Wrench,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Factory,
} from 'lucide-react';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { id: 'operations', label: 'Operations', icon: <LayoutDashboard size={20} /> },
  { id: 'blueprints', label: 'Blueprint Library', icon: <FileText size={20} /> },
  { id: 'job-builder', label: 'Job Builder', icon: <Wrench size={20} /> },
  { id: 'operator-roster', label: 'Operator Roster', icon: <Users size={20} /> },
  { id: 'faults', label: 'Fault Records', icon: <AlertTriangle size={20} /> },
];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy-900 rounded-lg flex items-center justify-center">
            <Factory size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-navy-900 text-sm">Dojo Hub</span>
              <span className="text-[10px] text-slate-500 -mt-0.5">Uganda MES</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`nav-item w-full ${
              activeNav === item.id ? 'nav-item-active' : 'nav-item-inactive'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="nav-item nav-item-inactive w-full justify-center"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
