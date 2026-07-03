import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Clock,
  MapPin,
  FileText,
  CheckSquare,
  BarChart3,
  ClipboardCheck,
  AlertTriangle,
  Edit3,
  Archive,
  X,
  AlertCircle,
  Layers,
} from 'lucide-react';
import type { Blueprint, BlueprintCategory } from '../types';

interface BlueprintCardProps {
  blueprint: Blueprint;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}

function BlueprintCard({ blueprint, onEdit, onArchive }: BlueprintCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const categoryLabels: Record<BlueprintCategory, string> = {
    preparation: 'Preparation',
    processing: 'Processing',
    packaging: 'Packaging',
    quality_control: 'Quality Control',
  };

  const categoryBadgeStyles: Record<BlueprintCategory, string> = {
    preparation: 'bg-navy-100 text-navy-700 border-navy-200',
    processing: 'bg-info-100 text-info-700 border-info-200',
    packaging: 'bg-warning-100 text-warning-700 border-warning-200',
    quality_control: 'bg-success-100 text-success-700 border-success-200',
  };

  const enabledFeatures = [
    { enabled: blueprint.guidelinesEnabled, label: 'Guidelines', icon: <FileText size={12} /> },
    { enabled: blueprint.checklistEnabled, label: 'Checklist', icon: <CheckSquare size={12} /> },
    { enabled: blueprint.quantityLoggingEnabled, label: 'Quantity', icon: <BarChart3 size={12} /> },
    { enabled: blueprint.qcFormEnabled, label: 'QC Form', icon: <ClipboardCheck size={12} /> },
    { enabled: blueprint.faultCategoriesEnabled, label: 'Faults', icon: <AlertTriangle size={12} /> },
  ].filter(f => f.enabled);

  return (
    <div
      className={`card ${blueprint.isArchived ? 'opacity-60' : ''} transition-all duration-200 relative overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover overlay */}
      {isHovered && !blueprint.isArchived && (
        <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm z-10 flex items-center justify-center gap-3 transition-all duration-200">
          <button
            onClick={() => onEdit(blueprint.id)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-navy-900 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Edit3 size={16} />
            <span>Edit Template</span>
          </button>
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-danger-600 text-white font-medium rounded-lg hover:bg-danger-700 transition-colors"
          >
            <Archive size={16} />
            <span>Archive</span>
          </button>
        </div>
      )}

      {/* Archive confirmation overlay */}
      {showArchiveConfirm && (
        <div className="absolute inset-0 bg-danger-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4">
          <AlertCircle size={32} className="text-white mb-3" />
          <p className="text-white font-medium text-center mb-4">Archive this template?</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowArchiveConfirm(false);
              }}
              className="px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(blueprint.id);
                setShowArchiveConfirm(false);
              }}
              className="px-4 py-2 bg-danger-600 text-white font-medium rounded-lg hover:bg-danger-500 transition-colors text-sm"
            >
              Archive
            </button>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{blueprint.name}</h3>
            {blueprint.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{blueprint.description}</p>
            )}
          </div>
          <span className={`status-badge text-[10px] ${categoryBadgeStyles[blueprint.category]}`}>
            {categoryLabels[blueprint.category]}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{blueprint.estimatedDurationMinutes} min</span>
          </div>
          {blueprint.stationTag && (
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{blueprint.stationTag}</span>
            </div>
          )}
        </div>

        {/* Feature toggles */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {enabledFeatures.length > 0 ? (
            enabledFeatures.map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-navy-50 text-navy-700 text-[10px] font-medium rounded-full"
              >
                {feature.icon}
                {feature.label}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No features enabled</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface BlueprintCatalogProps {
  blueprints: Blueprint[];
  onCreateNew: () => void;
  onEditBlueprint: (id: string) => void;
  onArchiveBlueprint: (id: string) => void;
}

export function BlueprintCatalog({
  blueprints,
  onCreateNew,
  onEditBlueprint,
  onArchiveBlueprint,
}: BlueprintCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BlueprintCategory | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const categories: { key: BlueprintCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'preparation', label: 'Preparation' },
    { key: 'processing', label: 'Processing' },
    { key: 'packaging', label: 'Packaging' },
    { key: 'quality_control', label: 'Quality Control' },
  ];

  const filteredBlueprints = useMemo(() => {
    return blueprints.filter(bp => {
      const matchesSearch = bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = activeCategory === 'all' || bp.category === activeCategory;
      const matchesArchive = showArchived ? bp.isArchived : !bp.isArchived;
      return matchesSearch && matchesCategory && matchesArchive;
    });
  }, [blueprints, searchQuery, activeCategory, showArchived]);

  const activeCount = blueprints.filter(bp => !bp.isArchived).length;
  const archivedCount = blueprints.filter(bp => bp.isArchived).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={24} className="text-navy-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Blueprint Library</h1>
              <p className="text-sm text-slate-500">{activeCount} active templates {archivedCount > 0 && `• ${archivedCount} archived`}</p>
            </div>
          </div>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={18} />
            <span>Create Blueprint</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blueprints..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-navy-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showArchived
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Archive size={16} />
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Blueprint Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
        {filteredBlueprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layers size={48} className="text-slate-300 mb-4" />
            <h3 className="font-medium text-slate-600 mb-2">No blueprints found</h3>
            <p className="text-sm text-slate-400 mb-4">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Create your first blueprint to get started'}
            </p>
            {!searchQuery && !showArchived && (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>Create Blueprint</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBlueprints.map(blueprint => (
              <BlueprintCard
                key={blueprint.id}
                blueprint={blueprint}
                onEdit={onEditBlueprint}
                onArchive={onArchiveBlueprint}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
