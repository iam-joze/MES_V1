import { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  User,
  Wrench,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchFaultRecords } from '../data/executiveData';
import type { FaultRecord } from '../types';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function FaultRecordsView() {
  const [faults, setFaults] = useState<FaultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');

  // Default date range: last 30 days
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  const loadFaults = async () => {
    setLoading(true);
    try {
      const data = await fetchFaultRecords(startDate, endDate);
      setFaults(data);
    } catch (e) {
      console.error('Failed to load faults:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaults();
  }, []);

  const filteredFaults = faults.filter((f) => {
    if (filter === 'resolved') return f.resolvedAt !== null;
    if (filter === 'unresolved') return f.resolvedAt === null;
    return true;
  });

  const unresolvedCount = faults.filter((f) => !f.resolvedAt).length;
  const resolvedCount = faults.filter((f) => f.resolvedAt).length;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Fault Records</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track and review fault reports from the production floor.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-slate-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{faults.length}</p>
              <p className="text-xs text-slate-500">Total Faults</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-danger-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600">{unresolvedCount}</p>
              <p className="text-xs text-slate-500">Unresolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-success-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">{resolvedCount}</p>
              <p className="text-xs text-slate-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" strokeWidth={2.5} />
          <span className="text-sm font-medium text-slate-600">Filter:</span>
          <div className="flex gap-1">
            {(['all', 'unresolved', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === f
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'unresolved' ? 'Unresolved' : 'Resolved'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={loadFaults}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} strokeWidth={2.5} />
          Refresh
        </button>
      </div>

      {/* Faults List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 size={24} className="text-navy-500 animate-spin" />
        </div>
      ) : filteredFaults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <CheckCircle2 size={32} className="text-success-500 mb-2" strokeWidth={2} />
          <p className="font-semibold text-slate-700">No faults found</p>
          <p className="text-sm text-slate-500 mt-1">
            {filter === 'all'
              ? 'No fault records in the selected period.'
              : filter === 'resolved'
              ? 'No resolved faults.'
              : 'No unresolved faults.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaults.map((fault) => (
            <div
              key={fault.id}
              className={`bg-white rounded-xl border overflow-hidden ${
                fault.resolvedAt ? 'border-slate-200' : 'border-danger-200'
              }`}
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        fault.resolvedAt
                          ? 'bg-success-100'
                          : fault.severity === 'critical'
                          ? 'bg-danger-100'
                          : 'bg-warning-100'
                      }`}
                    >
                      {fault.resolvedAt ? (
                        <CheckCircle2
                          size={20}
                          className="text-success-600"
                          strokeWidth={2.5}
                        />
                      ) : fault.severity === 'critical' ? (
                        <AlertCircle
                          size={20}
                          className="text-danger-600"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <AlertTriangle
                          size={20}
                          className="text-warning-600"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{fault.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Wrench size={12} strokeWidth={2.5} />
                        {fault.lineName}
                        {fault.category && (
                          <>
                            <span className="text-slate-300">·</span>
                            {fault.category}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-md ${
                      fault.resolvedAt
                        ? 'bg-success-100 text-success-700'
                        : fault.severity === 'critical'
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}
                  >
                    {fault.resolvedAt ? 'RESOLVED' : fault.severity.toUpperCase()}
                  </span>
                </div>

                {/* Description */}
                {fault.description && (
                  <p className="text-sm text-slate-600 mb-3">{fault.description}</p>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} strokeWidth={2.5} />
                    {formatDate(fault.loggedAt)} at {formatTime(fault.loggedAt)}
                  </span>
                  {fault.operatorName && (
                    <span className="flex items-center gap-1">
                      <User size={12} strokeWidth={2.5} />
                      {fault.operatorName}
                    </span>
                  )}
                </div>

                {/* Resolution Info */}
                {fault.resolvedAt && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-success-500 flex-shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Resolved {formatDate(fault.resolvedAt)} at{' '}
                          {formatTime(fault.resolvedAt)}
                        </p>
                        {fault.resolvedBy && (
                          <p className="text-xs text-slate-500">By: {fault.resolvedBy}</p>
                        )}
                        {fault.resolutionNotes && (
                          <p className="text-xs text-slate-600 mt-1">
                            {fault.resolutionNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
