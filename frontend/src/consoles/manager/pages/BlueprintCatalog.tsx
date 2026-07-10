import { useState } from "react";
import { Layers, Search, Plus, Archive, Clock, MapPin } from "lucide-react";
import BlueprintBuilderDrawer, { CATEGORIES, FEATURE_TAGS } from "./BlueprintBuilder";
import type { Blueprint, BlueprintCategory } from "./BlueprintBuilder";

/* ---------------------------------------------------------------------
   Mock data — 8 active + 1 archived blueprint, matching the reference
   screenshot exactly. Replace with blueprintApi.fetchBlueprints() once
   the backend (Bolt Database) is wired up.
--------------------------------------------------------------------- */

const CATEGORY_STYLES: Record<BlueprintCategory, string> = {
  Preparation: "bg-slate-100 text-slate-600",
  Processing: "bg-sky-50 text-sky-700",
  Packaging: "bg-amber-50 text-amber-700",
  "Quality Control": "bg-emerald-50 text-emerald-700",
};

const INITIAL_BLUEPRINTS: Blueprint[] = [
  {
    id: "bp-1",
    name: "Fruit Sorting & Washing",
    description: "Initial preparation stage for sorting raw fruit materials and washing before processing.",
    category: "Preparation",
    duration: 45,
    station: "Station A",
    archived: false,
    features: ["guidelines", "checklist", "faults"],
  },
  {
    id: "bp-2",
    name: "Juice Extraction",
    description: "Core processing stage for extracting juice from prepared fruit pulp.",
    category: "Processing",
    duration: 60,
    station: "Station B",
    archived: false,
    features: ["guidelines", "checklist", "quantity", "qcForm", "faults"],
  },
  {
    id: "bp-3",
    name: "UHT Pasteurization",
    description: "Ultra-high temperature pasteurization process for juice sterilization.",
    category: "Processing",
    duration: 90,
    station: "Station C",
    archived: false,
    features: ["guidelines", "checklist", "quantity", "qcForm", "faults"],
  },
  {
    id: "bp-4",
    name: "TetraPak Filling",
    description: "Automated aseptic filling into TetraPak containers.",
    category: "Packaging",
    duration: 45,
    station: "Station D",
    archived: false,
    features: ["guidelines", "checklist", "faults"],
  },
  {
    id: "bp-5",
    name: "Mango Pulp Blending",
    description: "Mix mango pulp with water, sugar, and preservatives to create final juice blend.",
    category: "Processing",
    duration: 75,
    station: "Station E",
    archived: false,
    features: ["guidelines", "quantity", "qcForm"],
  },
  {
    id: "bp-6",
    name: "Quality Inspection Gate",
    description: "Final quality control checkpoint before packaging release.",
    category: "Quality Control",
    duration: 30,
    station: "QC Station",
    archived: false,
    features: ["guidelines", "checklist", "qcForm"],
  },
  {
    id: "bp-7",
    name: "Bottle Sterilization",
    description: "Steam sterilization of PET bottles before filling.",
    category: "Packaging",
    duration: 40,
    station: "Station F",
    archived: false,
    features: ["guidelines", "checklist", "faults"],
  },
  {
    id: "bp-8",
    name: "Labeling & Date Coding",
    description: "Apply product labels and expiration date codes to filled containers.",
    category: "Packaging",
    duration: 25,
    station: "Station G",
    archived: false,
    features: ["guidelines", "quantity", "qcForm"],
  },
  {
    id: "bp-9",
    name: "Legacy Capping Process",
    description: "Superseded by the automated TetraPak Filling stage; retained for historical jobs only.",
    category: "Packaging",
    duration: 35,
    station: "Station D",
    archived: true,
    features: ["guidelines", "faults"],
  },
];

let uidCounter = 200;
const nextId = () => `bp-${uidCounter++}`;

/* ---------------------------------------------------------------------
   Blueprint Catalog (M2)
   SRS ref: SRS 3.3, 4.2.2 | UI Brief ref: Section 5.2, M2
--------------------------------------------------------------------- */

type FilterValue = "All" | BlueprintCategory | "Archived";

export default function BlueprintCatalog() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>(INITIAL_BLUEPRINTS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const activeCount = blueprints.filter((b) => !b.archived).length;
  const archivedCount = blueprints.filter((b) => b.archived).length;

  const visible = blueprints.filter((b) => {
    if (activeFilter === "Archived") {
      if (!b.archived) return false;
    } else {
      if (b.archived) return false;
      if (activeFilter !== "All" && b.category !== activeFilter) return false;
    }
    if (search.trim() && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setDrawerOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  };

  const confirmArchive = () => {
    setBlueprints((prev) => prev.map((b) => (b.id === archiveTarget ? { ...b, archived: true } : b)));
    setArchiveTarget(null);
  };

  const editingBlueprint = blueprints.find((b) => b.id === editingId) || null;

  const handleSave = (bp: Omit<Blueprint, "id" | "archived">) => {
    if (editingId) {
      setBlueprints((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...bp } : b)));
    } else {
      setBlueprints((prev) => [...prev, { id: nextId(), archived: false, ...bp }]);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="relative text-slate-900">
      <div>
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-slate-700" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Blueprint Library</h1>
              <p className="text-xs text-slate-500">
                {activeCount} active templates · {archivedCount} archived
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Create Blueprint
          </button>
        </div>

        {/* Search + filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blueprints..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white p-1">
            {(["All", ...CATEGORIES] as FilterValue[]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveFilter(c)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === c ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveFilter(activeFilter === "Archived" ? "All" : "Archived")}
            className={`ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              activeFilter === "Archived"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Archive className="h-3.5 w-3.5" /> Archived
          </button>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm font-semibold text-slate-600">
              {activeFilter === "Archived" ? "No archived blueprints." : "No blueprints match your search."}
            </p>
            {activeFilter !== "Archived" && (
              <button
                onClick={openCreate}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" /> Create Blueprint
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((bp) => (
              <div
                key={bp.id}
                onClick={() => openEdit(bp.id)}
                className={`group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md ${
                  bp.archived ? "opacity-60" : ""
                }`}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{bp.name}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${CATEGORY_STYLES[bp.category]}`}>
                    {bp.category}
                  </span>
                </div>
                <p className="mb-3 flex-1 text-xs leading-relaxed text-slate-500">{bp.description}</p>
                <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {bp.duration} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {bp.station}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bp.features
                    .filter((f) => FEATURE_TAGS[f])
                    .map((f) => {
                      const tag = FEATURE_TAGS[f];
                      const Icon = tag.icon;
                      return (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500"
                        >
                          <Icon className="h-3 w-3" /> {tag.label}
                        </span>
                      );
                    })}
                </div>
                {!bp.archived && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setArchiveTarget(bp.id);
                    }}
                    className="mt-3 self-start text-[11px] font-semibold text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  >
                    Archive blueprint
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archive confirmation */}
      {archiveTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Archive this blueprint?</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              It will be removed from the library for new jobs, but stays visible under Archived, and any active
              jobs already using it are unaffected — they hold a frozen copy.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setArchiveTarget(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit drawer (M2a) */}
      {drawerOpen && (
        <BlueprintBuilderDrawer initial={editingBlueprint} onClose={() => setDrawerOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}