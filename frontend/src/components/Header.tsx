import { useState } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings, AlertOctagon } from 'lucide-react';

interface HeaderProps {
  onEmergencyStop: () => void;
  userName?: string;
  userRole?: string;
}

export function Header({ onEmergencyStop, userName, userRole }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, operators, or faults..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Emergency Stop Button */}
        <button
          onClick={onEmergencyStop}
          className="flex items-center gap-2 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-150 border-2 border-danger-700"
        >
          <AlertOctagon size={18} className="animate-pulse" />
          <span className="text-sm tracking-wide">EMERGENCY STOP</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-card shadow-card-elevated border border-slate-200 z-50">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 border-b border-slate-100">
                  <p className="text-sm text-slate-700">New fault reported on Line 1</p>
                  <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
                </div>
                <div className="p-3 hover:bg-slate-50">
                  <p className="text-sm text-slate-700">Job #402 completed successfully</p>
                  <p className="text-xs text-slate-500 mt-1">15 minutes ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900">{userName || 'Admin User'}</p>
              <p className="text-xs text-slate-500">{userRole || 'Plant Manager'}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-card shadow-card-elevated border border-slate-200 z-50">
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <hr className="my-1 border-slate-200" />
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
