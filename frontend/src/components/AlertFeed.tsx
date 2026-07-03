import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  PauseCircle,
  UserX,
  ChevronRight,
  CheckCircle,
  Clock,
  Wrench,
  PackageX,
  Zap,
} from 'lucide-react';
import type { Alert, AlertType, FaultSeverity } from '../types';

const alertIcons: Record<AlertType, React.ReactNode> = {
  fault: <AlertTriangle size={18} />,
  paused: <PauseCircle size={18} />,
  unassigned: <UserX size={18} />,
};

const severityIcons: Record<FaultSeverity, React.ReactNode> = {
  critical: <AlertCircle size={20} className="text-danger-500" />,
  minor: <AlertTriangle size={20} className="text-warning-500" />,
};

interface AlertCardProps {
  alert: Alert;
  onResolve: (id: string) => void;
  onReview: (id: string) => void;
}

function AlertCard({ alert, onResolve, onReview }: AlertCardProps) {
  const getBorderStyle = () => {
    if (alert.type === 'fault' && alert.severity === 'critical') {
      return 'border-l-danger-500 bg-danger-50';
    }
    if (alert.type === 'fault' && alert.severity === 'minor') {
      return 'border-l-warning-500 bg-warning-50';
    }
    if (alert.type === 'paused') {
      return 'border-l-warning-400 bg-warning-50/50';
    }
    return 'border-l-info-400 bg-info-50/50';
  };

  const getBadgeStyle = () => {
    if (alert.type === 'fault' && alert.severity === 'critical') {
      return 'status-badge-danger';
    }
    if (alert.type === 'fault' && alert.severity === 'minor') {
      return 'status-badge-warning';
    }
    if (alert.type === 'paused') {
      return 'status-badge-warning';
    }
    return 'status-badge-info';
  };

  const getBadgeLabel = () => {
    if (alert.type === 'fault') {
      return alert.severity?.toUpperCase() + ': ' + alert.title;
    }
    if (alert.type === 'paused') {
      return 'PAUSED: ' + alert.title;
    }
    return 'UNASSIGNED: ' + alert.title;
  };

  return (
    <div className={`card border-l-4 ${getBorderStyle()} p-4 transition-all duration-200 hover:shadow-card`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {alert.type === 'fault' ? severityIcons[alert.severity!] : alertIcons[alert.type]}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`status-badge ${getBadgeStyle()} mb-2 inline-flex`}>
            {getBadgeLabel()}
          </span>
          <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
          {alert.line && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Wrench size={12} />
              <span>{alert.line}</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <Clock size={12} />
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
        <button
          onClick={() => onResolve(alert.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <CheckCircle size={14} />
          <span>Resolve Alert</span>
        </button>
        <button
          onClick={() => onReview(alert.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-navy-100 hover:bg-navy-200 text-navy-700 text-sm font-medium rounded-lg transition-colors"
        >
          <ChevronRight size={14} />
          <span>Review Detail</span>
        </button>
      </div>
    </div>
  );
}

interface AlertFeedProps {
  alerts: Alert[];
  onResolveAlert: (id: string) => void;
}

export function AlertFeed({ alerts, onResolveAlert }: AlertFeedProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'minor' | 'paused' | 'unassigned'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'critical') return alert.type === 'fault' && alert.severity === 'critical';
    if (selectedFilter === 'minor') return alert.type === 'fault' && alert.severity === 'minor';
    return alert.type === selectedFilter;
  });

  const criticalCount = alerts.filter(a => a.type === 'fault' && a.severity === 'critical').length;
  const minorCount = alerts.filter(a => a.type === 'fault' && a.severity === 'minor').length;
  const pausedCount = alerts.filter(a => a.type === 'paused').length;
  const unassignedCount = alerts.filter(a => a.type === 'unassigned').length;

  const handleReview = (id: string) => {
    console.log(`Reviewing alert ${id}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-navy-500" />
            <h3 className="font-semibold text-slate-900">Live Attention Feed</h3>
          </div>
          <span className="status-badge status-badge-danger">{alerts.length} active</span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === 'all'
                ? 'bg-navy-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({alerts.length})
          </button>
          {criticalCount > 0 && (
            <button
              onClick={() => setSelectedFilter('critical')}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedFilter === 'critical'
                  ? 'bg-danger-600 text-white'
                  : 'bg-danger-100 text-danger-700 hover:bg-danger-200'
              }`}
            >
              Critical ({criticalCount})
            </button>
          )}
          {minorCount > 0 && (
            <button
              onClick={() => setSelectedFilter('minor')}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedFilter === 'minor'
                  ? 'bg-warning-500 text-white'
                  : 'bg-warning-100 text-warning-700 hover:bg-warning-200'
              }`}
            >
              Minor ({minorCount})
            </button>
          )}
          {pausedCount > 0 && (
            <button
              onClick={() => setSelectedFilter('paused')}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedFilter === 'paused'
                  ? 'bg-warning-500 text-white'
                  : 'bg-warning-100 text-warning-700 hover:bg-warning-200'
              }`}
            >
              Paused ({pausedCount})
            </button>
          )}
          {unassignedCount > 0 && (
            <button
              onClick={() => setSelectedFilter('unassigned')}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedFilter === 'unassigned'
                  ? 'bg-info-600 text-white'
                  : 'bg-info-100 text-info-700 hover:bg-info-200'
              }`}
            >
              Unassigned ({unassignedCount})
            </button>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="card p-8 text-center">
            <PackageX size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No alerts in this category</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={onResolveAlert}
              onReview={handleReview}
            />
          ))
        )}
      </div>
    </div>
  );
}
