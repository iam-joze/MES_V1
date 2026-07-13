import { useState } from 'react';
import { X, Phone, KeyRound, Shield, UserCheck, AlertTriangle, Loader2 } from 'lucide-react';

const AVAILABLE_SKILLS = [
  'Pasteurization', 'Blender Ops', 'Filling', 'Capping', 'Labeling',
  'Packaging', 'QC Certified', 'Washing', 'Pulping', 'Mixing',
  'Maintenance', 'Lab Testing', 'All Stations', 'Sorting',
];

interface RegisterOperatorModalProps {
  onClose: () => void;
  onRegistered: () => void;
  onSubmit: (data: { name: string; phone: string; pin: string; skills: string[] }) => Promise<void>;
}

export function RegisterOperatorModal({ onClose, onRegistered, onSubmit }: RegisterOperatorModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name is required (min 2 characters)';
    if (!/^\+?[\d\s-]{10,15}$/.test(phone.trim())) e.phone = 'Valid phone number required (10–15 digits)';
    if (!/^\d{4}$/.test(pin)) e.pin = 'PIN must be exactly 4 digits';
    if (pin !== confirmPin) e.confirmPin = 'PINs do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim(), pin, skills });
      onRegistered();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || 'Failed to register operator' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-navy-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
              <UserCheck size={20} className="text-navy-700" />
            </div>
            <h2 className="font-bold text-slate-900">Register New Operator</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
              <AlertTriangle size={16} />{errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Operator full name"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.name ? 'border-danger-500' : 'border-slate-200'}`}
            />
            {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Phone size={14} className="inline mr-1" />Phone Number (Login ID)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000000"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.phone ? 'border-danger-500' : 'border-slate-200'}`}
            />
            {errors.phone && <p className="text-xs text-danger-600 mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <KeyRound size={14} className="inline mr-1" />4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="XXXX"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.pin ? 'border-danger-500' : 'border-slate-200'}`}
              />
              {errors.pin && <p className="text-xs text-danger-600 mt-1">{errors.pin}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="XXXX"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 ${errors.confirmPin ? 'border-danger-500' : 'border-slate-200'}`}
              />
              {errors.confirmPin && <p className="text-xs text-danger-600 mt-1">{errors.confirmPin}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Shield size={14} className="inline mr-1" />Skill Certifications
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SKILLS.map((skill) => (
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
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Register
          </button>
        </div>
      </div>
    </div>
  );
}