import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Briefcase,
  Settings,
  Wrench,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useAuth, type Role } from '../../contexts/AuthContext';

type TabId = 'executive' | 'manager' | 'operator';

const CONSOLE_ROOT: Record<Role, string> = {
  EXECUTIVE: '/executive',
  MANAGER: '/manager',
  OPERATOR: '/operator',
};

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  helperText: string;
}

const tabs: TabConfig[] = [
  {
    id: 'executive',
    label: 'Executive',
    icon: <Briefcase size={22} strokeWidth={2.5} />,
    helperText: 'Corporate leadership access. Use your registered company email and password.',
  },
  {
    id: 'manager',
    label: 'Manager',
    icon: <Settings size={22} strokeWidth={2.5} />,
    helperText: 'Plant operations management. Sign in with your registered corporate email and password.',
  },
  {
    id: 'operator',
    label: 'Operator',
    icon: <Wrench size={22} strokeWidth={2.5} />,
    helperText: 'Floor production access. Enter your registered mobile number and 4-digit security PIN.',
  },
];

const DEMO_MANAGERS = [
  { name: 'Muto John', email: 'muto12@gmail.com' },
  { name: 'Babirye Janet', email: 'janet.babirye@dojohubug.com' },
  { name: 'Job Wasswa', email: 'jobwasswa24@gmail.com' },
];

const DEMO_OPERATORS = [
  { name: 'Jim Kim', phone: '+256700333222', pin: '2323' },
  { name: 'Auma Lydia', phone: '+256700456789', pin: '4567' },
];

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = ['', '', '', ''];
  for (let i = 0; i < 4; i++) digits[i] = value[i] || '';

  const handleChange = (index: number, char: string) => {
    const sanitized = char.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(4, ' ').split('');
    arr[index] = sanitized;
    const newVal = arr.join('').replace(/\s/g, '');
    onChange(newVal);
    if (sanitized && index < 3) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      onChange(pasted);
      inputsRef.current[Math.min(pasted.length, 3)]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-16 h-16 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 transition-all"
          placeholder="0"
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setIsOnline(navigator.onLine), 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold ${
        isOnline ? 'bg-success-100 text-success-700 border border-success-200' : 'bg-danger-100 text-danger-700 border border-danger-200'
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`} />
      {isOnline ? 'System Online' : 'Connection Lost'}
    </div>
  );
}

function ShowcasePanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy-950 relative overflow-hidden p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-slate-950" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-info-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-success-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <Factory size={26} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Dojo Hub Uganda</h2>
            <p className="text-sm text-slate-400 leading-tight">Manufacturing Execution System</p>
          </div>
        </div>
        <NetworkStatusBadge />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Dojo Hub Uganda<br />MES Portal
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed mb-8">
          Premium automated beverage manufacturing — from mango and pineapple pulp extraction
          to aseptic filling and quality control. One unified platform for executives, managers,
          and floor operators.
        </p>
        <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9]">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-700 to-navy-900" />
          <svg viewBox="0 0 400 225" className="absolute inset-0 w-full h-full p-6">
            <rect x="20" y="140" width="360" height="12" rx="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            {[60, 120, 180, 240, 300].map((x) => (
              <g key={x}>
                <rect x={x} y="100" width="24" height="40" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <rect x={x + 8} y="88" width="8" height="16" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              </g>
            ))}
            <rect x="40" y="60" width="60" height="40" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <rect x="160" y="50" width="80" height="50" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <rect x="300" y="60" width="60" height="40" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <text x="70" y="85" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="bold">FILL</text>
            <text x="200" y="80" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="bold">UHT</text>
            <text x="330" y="85" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontWeight="bold">QC</text>
            <circle cx="70" cy="55" r="3" fill="#22c55e" />
            <circle cx="200" cy="45" r="3" fill="#22c55e" />
            <circle cx="330" cy="55" r="3" fill="#fbbf24" />
          </svg>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
            <span className="text-xs font-medium text-white/80">Line A — Active Production</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-4">
        {[
          { label: 'Real-time OEE', value: '87%' },
          { label: 'Active Lines', value: '3' },
          { label: 'Today Output', value: '14,200L' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('executive');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  useEffect(() => {
    setErrors({});
    setAuthError(null);
  }, [activeTab]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (activeTab === 'executive' || activeTab === 'manager') {
      if (!email) {
        newErrors.email = 'Corporate email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Enter a valid corporate email address.';
      }
      if (!password) {
        newErrors.password = 'Password is required.';
      }
    } else {
      if (!phone) {
        newErrors.phone = 'Mobile phone number is required.';
      }
      if (!pin || pin.length !== 4) {
        newErrors.pin = 'Enter all 4 digits of your security PIN.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [activeTab, email, phone, password, pin]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      if (!validate()) return;

      setIsSubmitting(true);
      try {
        const identifier = activeTab === 'operator' ? phone.trim() : email.trim();
        const credential = activeTab === 'operator' ? pin : password;
        const user = await login(identifier, credential);
        navigate(CONSOLE_ROOT[user.role], { replace: true });
      } catch (err: any) {
        setAuthError(err?.response?.data?.message || 'Authentication Failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeTab, email, phone, password, pin, validate, login, navigate]
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <ShowcasePanel />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center">
              <Factory size={26} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900 leading-tight">Dojo Hub Uganda</h2>
              <p className="text-sm text-slate-500 leading-tight">MES Portal</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card-elevated border border-slate-200/50 p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Workspace Access</h1>
              <p className="text-base text-slate-500 mt-1">Select your role and sign in to continue.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="text-sm text-slate-500 mb-5 leading-relaxed">{currentTab.helperText}</p>

            {authError && (
              <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-danger-50 border border-danger-200">
                <AlertCircle size={22} className="text-danger-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-sm font-medium text-danger-700">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(activeTab === 'executive' || activeTab === 'manager') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Corporate Email Address</label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exec@dojohubug.com"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 text-base text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                        errors.email ? 'border-danger-300 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10' : 'border-slate-200 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-danger-600 mt-1.5 font-medium">{errors.email}</p>}
                </div>
              )}

              {activeTab === 'operator' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registered Mobile Number</label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" strokeWidth={2.5} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+256 700 456 789"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 text-base text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                        errors.phone ? 'border-danger-300 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10' : 'border-slate-200 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-danger-600 mt-1.5 font-medium">{errors.phone}</p>}
                </div>
              )}

              {(activeTab === 'executive' || activeTab === 'manager') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 text-base text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                        errors.password ? 'border-danger-300 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10' : 'border-slate-200 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-danger-600 mt-1.5 font-medium">{errors.password}</p>}
                  {activeTab === 'manager' && !errors.password && (
                    <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1">
                      Default password for all manager accounts:
                      <button type="button" onClick={() => setPassword('manager2024')} className="font-mono font-semibold text-navy-700 hover:text-navy-900 underline underline-offset-2 transition-colors">
                        manager2024
                      </button>
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'operator' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">4-Digit Security PIN</label>
                  <PinInput value={pin} onChange={setPin} />
                  {errors.pin && <p className="text-sm text-danger-600 mt-2 font-medium text-center">{errors.pin}</p>}
                </div>
              )}

              {isSubmitting ? (
                <div className="w-full py-4 rounded-xl bg-navy-50 border-2 border-navy-200 flex items-center justify-center gap-3">
                  <Loader2 size={24} className="text-navy-600 animate-spin" strokeWidth={2.5} />
                  <span className="text-base font-semibold text-navy-700">Verifying Access Rights...</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-navy-900 hover:bg-navy-800 active:scale-[0.99] text-white text-base font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Authenticate &amp; Enter Workspace
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              )}

              <p className="text-center text-sm text-slate-500">
                Forgot Credentials? <span className="font-semibold text-navy-600 hover:text-navy-700 cursor-pointer">Contact System Administrator</span>
              </p>
            </form>

            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-slate-500" strokeWidth={2.5} />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Demo Test Credentials</h3>
              </div>
              <div className="space-y-2 text-sm">
                {activeTab === 'executive' && (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                      <p className="font-mono text-slate-800">exec@dojohubug.com</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Password</p>
                      <p className="font-mono text-slate-800">exec2024</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEmail('exec@dojohubug.com'); setPassword('exec2024'); }}
                      className="px-3 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors"
                    >
                      Autofill
                    </button>
                  </div>
                )}
                {activeTab === 'manager' && (
                  <div className="space-y-2">
                    {DEMO_MANAGERS.map((m) => (
                      <div key={m.email} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase">{m.name}</p>
                          <p className="font-mono text-slate-800 text-xs">{m.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setEmail(m.email); setPassword('manager2024'); }}
                          className="px-3 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors"
                        >
                          Autofill
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'operator' && (
                  <div className="space-y-2">
                    {DEMO_OPERATORS.map((op) => (
                      <div key={op.phone} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase">{op.name}</p>
                          <p className="font-mono text-slate-800 text-xs">{op.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500 uppercase">PIN</p>
                          <p className="font-mono text-slate-800">{op.pin}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setPhone(op.phone); setPin(op.pin); }}
                          className="px-3 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors"
                        >
                          Autofill
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-400">
            <ShieldCheck size={16} strokeWidth={2.5} />
            <span>Secured by Dojo Hub Uganda MES — Role-based access control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
