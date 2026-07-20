import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Package, Users, AlertTriangle, X } from 'lucide-react';
import { api } from '../../../shared/lib/api';

interface JobResult {
  id: string;
  jobId: string;
  name: string;
  productName: string | null;
  status: string;
}

interface OperatorResult {
  id: string;
  name: string;
  phone: string;
  skills: string[];
}

interface FaultResult {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'MINOR';
  resolvedAt: string | null;
  jobId: string | null;
  jobName: string | null;
}

interface SearchResults {
  jobs: JobResult[];
  operators: OperatorResult[];
  faults: FaultResult[];
}

const EMPTY_RESULTS: SearchResults = { jobs: [], operators: [], faults: [] };

export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handle = setTimeout(() => {
      api
        .get<SearchResults>('/manager/search', { params: { q: trimmed } })
        .then((res) => setResults(res.data))
        .catch(() => setResults(EMPTY_RESULTS))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  const hasResults = results.jobs.length > 0 || results.operators.length > 0 || results.faults.length > 0;
  const trimmedQuery = query.trim();
  const showPanel = isOpen && trimmedQuery.length >= 2;

  const goTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        placeholder="Search jobs, operators, or faults..."
        className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/10"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setResults(EMPTY_RESULTS);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      )}

      {showPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-card-elevated z-40 max-h-[28rem] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Searching...
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-sm text-slate-400">No results for "{trimmedQuery}"</div>
          ) : (
            <div className="py-2">
              {results.jobs.length > 0 && (
                <ResultSection label="Jobs">
                  {results.jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => goTo(`/manager/job-builder?jobId=${job.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-navy-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{job.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {job.jobId}
                          {job.productName ? ` · ${job.productName}` : ''}
                        </p>
                      </div>
                      <StatusChip status={job.status} />
                    </button>
                  ))}
                </ResultSection>
              )}

              {results.operators.length > 0 && (
                <ResultSection label="Operators">
                  {results.operators.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => goTo('/manager/operator-roster')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
                        <Users size={16} className="text-info-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{op.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {op.phone}
                          {op.skills.length > 0 ? ` · ${op.skills.join(', ')}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </ResultSection>
              )}

              {results.faults.length > 0 && (
                <ResultSection label="Faults">
                  {results.faults.map((fault) => (
                    <button
                      key={fault.id}
                      onClick={() => goTo('/manager/faults')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          fault.severity === 'CRITICAL' ? 'bg-danger-100' : 'bg-warning-100'
                        }`}
                      >
                        <AlertTriangle size={16} className={fault.severity === 'CRITICAL' ? 'text-danger-600' : 'text-warning-600'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{fault.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {fault.jobName ?? fault.jobId ?? 'Unknown job'}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          fault.resolvedAt ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
                        }`}
                      >
                        {fault.resolvedAt ? 'Resolved' : 'Open'}
                      </span>
                    </button>
                  ))}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-500',
    ACTIVE: 'bg-info-100 text-info-700',
    PAUSED: 'bg-warning-100 text-warning-700',
    COMPLETED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${styles[status] || styles.DRAFT}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
