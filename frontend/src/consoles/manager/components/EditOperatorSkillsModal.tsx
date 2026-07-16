import { useState } from 'react';
import { X, Shield, AlertTriangle, Loader2, Save } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { useBlueprintSkills } from '../../../shared/lib/useBlueprintSkills';

interface Operator {
  id: string;
  name: string;
  skills: string[];
}

export function EditOperatorSkillsModal({ operator, onClose, onSaved }: {
  operator: Operator;
  onClose: () => void;
  onSaved: (operatorId: string, skills: string[]) => void;
}) {
  const [skills, setSkills] = useState<string[]>(operator.skills);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableSkills = useBlueprintSkills();

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/operators/${operator.id}`, { skills });
      onSaved(operator.id, skills);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update skills.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-navy-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-navy-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Edit Skill Certifications</h2>
              <p className="text-xs text-slate-500">{operator.name}</p>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
              <AlertTriangle size={16} />{error}
            </div>
          )}
          {availableSkills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No blueprints available yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                    skills.includes(skill) ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Skills
          </button>
        </div>
      </div>
    </div>
  );
}
