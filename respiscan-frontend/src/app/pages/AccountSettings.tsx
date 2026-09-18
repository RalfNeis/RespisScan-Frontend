import React, { useState } from 'react';
import {
  User, Lock, Bell, Sliders, Eye, EyeOff, Check,
  ShieldCheck, Monitor, Database, ChevronRight,
  AlertTriangle, Fingerprint,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* ─── types ─────────────────────────────────────────────── */

type TabId = 'profile' | 'security' | 'notifications' | 'system';

/* ─── reusable primitives ────────────────────────────────── */

function SectionBlock({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ label, hint, children, top }: {
  label: string; hint?: string; children: React.ReactNode; top?: boolean;
}) {
  return (
    <div className={cn('grid grid-cols-5 gap-6 px-6 py-4', top ? 'items-start' : 'items-center')}>
      <div className="col-span-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', disabled, suffix }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  type?: string; disabled?: boolean; suffix?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900',
          'placeholder-slate-400 transition',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
          disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed',
          suffix && 'pr-10',
        )}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 cursor-pointer',
        on ? 'bg-teal-500' : 'bg-slate-200',
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-4' : 'translate-x-0',
      )} />
    </button>
  );
}

function SaveButton({ saved, label = 'Save Changes', onClick }: {
  saved: boolean; label?: string; onClick: () => void;
}) {
  return (
    <div className="flex justify-end px-6 py-4">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
          saved ? 'bg-green-500 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white',
        )}
      >
        {saved ? <><Check className="h-4 w-4" /> Saved</> : label}
      </button>
    </div>
  );
}

/* ─── tab: Profile ───────────────────────────────────────── */

function ProfileTab({ user }: { user: { name: string; email: string; role: string } }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [specialty, setSpecialty] = useState(
    user.role === 'admin' ? 'Pulmonology / Radiology' : 'Respiratory Nursing'
  );
  const [department, setDepartment] = useState('Diagnostic Imaging Unit');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2400); };
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Avatar card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center
          text-white text-xl font-bold select-none shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-500 capitalize mt-0.5">
            {user.role === 'admin' ? 'Administrator' : 'Employee'} · {department}
          </p>
        </div>
        <span className={cn(
          'px-2.5 py-1 rounded-full text-xs font-semibold',
          user.role === 'admin'
            ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        )}>
          {user.role === 'admin' ? 'Administrator' : 'Employee'}
        </span>
      </div>

      {/* Fields */}
      <SectionBlock title="Personal Details" description="Your name and contact information displayed across the portal.">
        <Row label="Full name">
          <TextInput value={name} onChange={setName} placeholder="Full name" />
        </Row>
        <Row label="Email address" hint="Used for login and system notifications">
          <TextInput value={email} onChange={setEmail} type="email" placeholder="email@hospital.org" />
        </Row>
        <Row label="Specialty" hint="Your clinical designation or area of focus">
          <TextInput value={specialty} onChange={setSpecialty} placeholder="e.g. Pulmonology" />
        </Row>
        <Row label="Department">
          <TextInput value={department} onChange={setDepartment} placeholder="Department name" />
        </Row>
        <Row label="Bio" hint="Short professional summary (optional)" top>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Brief professional summary..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900
              placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500
              focus:border-transparent transition"
          />
        </Row>
      </SectionBlock>

      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

/* ─── tab: Security ──────────────────────────────────────── */

function SecurityTab() {
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [conf, setConf] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [timeout, setTimeout_] = useState('30');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const strength = (() => {
    if (!pw) return 0;
    return [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)]
      .filter(Boolean).length;
  })();
  const strengthMeta = [
    null,
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-orange-400' },
    { label: 'Good', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-green-500' },
  ][strength];

  const save = () => {
    if (pw && pw !== conf) { setError('Passwords do not match.'); return; }
    if (pw && pw.length < 8) { setError('Minimum 8 characters required.'); return; }
    setError('');
    setSaved(true);
    setCur(''); setPw(''); setConf('');
    setTimeout(() => setSaved(false), 2400);
  };

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="text-slate-400 hover:text-slate-600 transition-colors">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <SectionBlock
        title="Change Password"
        description="Choose a strong, unique password for this account."
      >
        <Row label="Current password">
          <TextInput value={cur} onChange={setCur} type={showCur ? 'text' : 'password'}
            placeholder="Current password" suffix={<EyeBtn show={showCur} toggle={() => setShowCur(v => !v)} />} />
        </Row>
        <Row label="New password" hint="At least 8 characters">
          <div className="space-y-2">
            <TextInput value={pw} onChange={setPw} type={showPw ? 'text' : 'password'}
              placeholder="New password" suffix={<EyeBtn show={showPw} toggle={() => setShowPw(v => !v)} />} />
            {pw && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= strength && strengthMeta ? strengthMeta.color : 'bg-slate-100'
                    )} />
                  ))}
                </div>
                {strengthMeta && <span className="text-xs text-slate-500 w-10">{strengthMeta.label}</span>}
              </div>
            )}
          </div>
        </Row>
        <Row label="Confirm password">
          <TextInput value={conf} onChange={setConf} type={showConf ? 'text' : 'password'}
            placeholder="Repeat new password" suffix={<EyeBtn show={showConf} toggle={() => setShowConf(v => !v)} />} />
        </Row>
        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="Access Control" description="Manage how and when your account can be accessed.">
        <Row label="Two-factor authentication" hint="Require a verification code on login">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className={cn('h-4 w-4', mfa ? 'text-teal-600' : 'text-slate-300')} />
              <span className={cn('text-sm font-medium', mfa ? 'text-teal-600' : 'text-slate-400')}>
                {mfa ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <Toggle on={mfa} onChange={setMfa} />
          </div>
        </Row>
        <Row label="Session timeout" hint="Automatically log out after inactivity">
          <Select value={timeout} onChange={setTimeout_} options={[
            { label: '15 minutes', value: '15' },
            { label: '30 minutes', value: '30' },
            { label: '1 hour', value: '60' },
            { label: '2 hours', value: '120' },
          ]} />
        </Row>
        <Row label="Active sessions" hint="Devices currently signed in" top>
          <div className="space-y-2">
            {[
              { device: 'Chrome · macOS', location: 'Manila, PH', current: true, when: 'Now' },
              { device: 'Firefox · Windows', location: 'Manila, PH', current: false, when: '2 days ago' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      {s.device}
                      {s.current && (
                        <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded font-medium">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{s.location} · {s.when}</p>
                  </div>
                </div>
                {!s.current && (
                  <button className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </Row>
      </SectionBlock>

      <SaveButton saved={saved} label="Update Security" onClick={save} />
    </div>
  );
}

/* ─── tab: Notifications ─────────────────────────────────── */

const NOTIF_EVENTS = [
  {
    id: 'diagnosis_complete', label: 'Diagnosis result ready',
    hint: 'When a YOLOv11 analysis finishes', roles: ['admin', 'employee'],
  },
  {
    id: 'positive_detection', label: 'Positive pneumonia detection',
    hint: 'Immediate alert on high-confidence positive result', roles: ['admin', 'employee'],
  },
  {
    id: 'patient_registered', label: 'New patient registered',
    hint: 'When a new patient record is created', roles: ['admin', 'employee'],
  },
  {
    id: 'report_generated', label: 'Report generated',
    hint: 'When a scheduled or ad-hoc report is ready', roles: ['admin', 'employee'],
  },
  {
    id: 'employee_login', label: 'Employee sign-in activity',
    hint: 'Login events and access changes', roles: ['admin'],
  },
  {
    id: 'system_alert', label: 'System & model alerts',
    hint: 'Model updates, downtime warnings, or errors', roles: ['admin'],
  },
];

function NotificationsTab({ role }: { role: string }) {
  const [email, setEmail] = useState(true);
  const [inApp, setInApp] = useState(true);
  const [events, setEvents] = useState<Record<string, boolean>>({
    diagnosis_complete: true,
    positive_detection: true,
    patient_registered: false,
    report_generated: true,
    employee_login: true,
    system_alert: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => setEvents(p => ({ ...p, [id]: !p[id] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2400); };

  const visible = NOTIF_EVENTS.filter(e => e.roles.includes(role));

  return (
    <div className="space-y-4">
      <SectionBlock title="Delivery Channels" description="How you want to receive notifications.">
        <Row label="In-app notifications" hint="Alerts shown inside the portal">
          <Toggle on={inApp} onChange={setInApp} />
        </Row>
        <Row label="Email notifications" hint="Sent to your registered email address">
          <Toggle on={email} onChange={setEmail} />
        </Row>
      </SectionBlock>

      <SectionBlock title="Event Triggers" description="Choose which events send you a notification.">
        {visible.map(ev => (
          <Row key={ev.id} label={ev.label} hint={ev.hint}>
            <Toggle on={events[ev.id] ?? false} onChange={() => toggle(ev.id)} />
          </Row>
        ))}
      </SectionBlock>

      <SaveButton saved={saved} label="Save Preferences" onClick={save} />
    </div>
  );
}

/* ─── tab: System (admin-only) ───────────────────────────── */

function SystemTab() {
  const [threshold, setThreshold] = useState(85);
  const [retention, setRetention] = useState('365');
  const [gradcam, setGradcam] = useState(true);
  const [autoReport, setAutoReport] = useState(false);
  const [audit, setAudit] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2400); };

  return (
    <div className="space-y-4">
      <SectionBlock title="AI Diagnostic Engine" description="Configure YOLOv11 detection and Grad-CAM display behavior.">
        <Row label="Confidence threshold" hint="Minimum score to flag a scan as positive">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <input
                type="range" min={50} max={99} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="flex-1 accent-teal-500 h-1.5 rounded-full"
              />
              <span className="text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200
                px-2.5 py-1 rounded-lg w-14 text-center tabular-nums">
                {threshold}%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Detections at or above {threshold}% confidence are flagged as positive.
            </p>
          </div>
        </Row>
        <Row label="Grad-CAM overlay" hint="Show heatmap on diagnosis results by default">
          <Toggle on={gradcam} onChange={setGradcam} />
        </Row>
        <Row label="Auto-generate report" hint="Create a report immediately after each completed scan">
          <Toggle on={autoReport} onChange={setAutoReport} />
        </Row>
      </SectionBlock>

      <SectionBlock title="Data & Compliance" description="Retention policies and audit trail configuration.">
        <Row label="Data retention period" hint="How long patient records are kept before archival">
          <Select value={retention} onChange={setRetention} options={[
            { label: '90 days', value: '90' },
            { label: '6 months', value: '180' },
            { label: '1 year', value: '365' },
            { label: '2 years', value: '730' },
            { label: 'Indefinite', value: '0' },
          ]} />
        </Row>
        <Row label="Audit logging" hint="Record all user actions for compliance review">
          <Toggle on={audit} onChange={setAudit} />
        </Row>
        <Row label="Export audit log" hint="Download a full CSV of all logged actions">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
            text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Database className="h-4 w-4 text-slate-400" />
            Download CSV
          </button>
        </Row>
      </SectionBlock>

      <SaveButton saved={saved} label="Apply Settings" onClick={save} />
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */

const TABS: { id: TabId; label: string; icon: React.ElementType; roles: string[] }[] = [
  { id: 'profile', label: 'Profile', icon: User, roles: ['admin', 'employee'] },
  { id: 'security', label: 'Security', icon: Lock, roles: ['admin', 'employee'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'employee'] },
  { id: 'system', label: 'System', icon: Sliders, roles: ['admin'] },
];

export function AccountSettings() {
  const { user } = useAuth();
  const [active, setActive] = useState<TabId>('profile');

  if (!user) return null;

  const tabs = TABS.filter(t => t.roles.includes(user.role));

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500">Manage your account, security, and preferences.</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Left nav */}
        <nav className="w-48 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {tabs.map((tab, i) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors',
                  i > 0 && 'border-t border-slate-100',
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <tab.icon className={cn('h-4 w-4', isActive ? 'text-teal-600' : 'text-slate-400')} />
                  {tab.label}
                </span>
                <ChevronRight className={cn('h-3.5 w-3.5', isActive ? 'text-teal-400' : 'text-slate-200')} />
              </button>
            );
          })}

          {/* Divider + role badge */}
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className={cn(
                'h-3.5 w-3.5',
                user.role === 'admin' ? 'text-teal-500' : 'text-slate-400'
              )} />
              <span className="text-xs text-slate-400 capitalize">
                {user.role === 'admin' ? 'Administrator' : 'Employee'}
              </span>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === 'profile' && <ProfileTab user={{ name: user.first_name ? `${user.first_name} ${user.last_name}` : user.username, email: user.email || '', role: user.role }} />}
          {active === 'security' && <SecurityTab />}
          {active === 'notifications' && <NotificationsTab role={user.role} />}
          {active === 'system' && user.role === 'admin' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}
