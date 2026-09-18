import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, User, Phone, MapPin, HeartPulse, AlertCircle, UserCheck, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../utils/api';

type FormData = {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  nationality: string;
  occupation: string;
  contactNumber: string;
  email: string;
  residentialAddress: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyContact: string;
  chiefComplaint: string;
  medicalHistory: string[];
  allergies: string;
  currentMedications: string;
  smokingStatus: string;
  referringPhysician: string;
  philhealthNumber: string;
};

const MEDICAL_HISTORY_OPTIONS = [
  'Hypertension', 'Diabetes Mellitus', 'Asthma / COPD', 'Tuberculosis',
  'Cardiac Disease', 'Renal Disease', 'Previous Pneumonia', 'Immunocompromised',
];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldInput({
  value, onChange, placeholder, type = 'text', disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-slate-50 disabled:cursor-not-allowed"
    />
  );
}

function SelectField({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
      <div className="h-7 w-7 rounded-md bg-teal-50 flex items-center justify-center">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

const empty: FormData = {
  firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: '',
  civilStatus: '', nationality: 'Filipino', occupation: '', contactNumber: '',
  email: '', residentialAddress: '', emergencyName: '', emergencyRelationship: '',
  emergencyContact: '', chiefComplaint: '', medicalHistory: [], allergies: '',
  currentMedications: '', smokingStatus: '', referringPhysician: '', philhealthNumber: '',
};

export function RegisterPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof FormData) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const toggleHistory = (item: string) => {
    setForm(f => ({
      ...f,
      medicalHistory: f.medicalHistory.includes(item)
        ? f.medicalHistory.filter(h => h !== item)
        : [...f.medicalHistory, item],
    }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.dateOfBirth) e.dateOfBirth = 'Required';
    if (!form.gender) e.gender = 'Required';
    if (!form.contactNumber.trim()) e.contactNumber = 'Required';
    if (!form.residentialAddress.trim()) e.residentialAddress = 'Required';
    return e;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    // Calculate age from date of birth
    const dob = new Date(form.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Generate a patient ID
    const patientId = `PT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    try {
      await api.post('/patients/', {
        patient_id: patientId,
        name: `${form.firstName} ${form.lastName}`,
        age: age,
        gender: form.gender,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/patients'), 1800);
    } catch (err: any) {
      setErrors({ firstName: err.body?.detail || err.message || 'Failed to save patient. Please try again.' });
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center">
          <Check className="h-8 w-8 text-teal-600" />
        </div>
        <p className="text-lg font-semibold text-slate-900">Patient Record Saved</p>
        <p className="text-sm text-slate-500">Redirecting to Patient Records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Patient Database
      </button>

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Patient</h2>
        <p className="text-slate-500 mt-1">Enter demographic data to create a new record prior to diagnosis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* ── Personal Information ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader icon={User} title="Personal Information" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label required>First Name</Label>
              <FieldInput value={form.firstName} onChange={set('firstName')} placeholder="e.g. Juan" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <Label required>Last Name</Label>
              <FieldInput value={form.lastName} onChange={set('lastName')} placeholder="e.g. Dela Cruz" />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>

            {/* Middle Name */}
            <div className="sm:col-span-2">
              <Label>Middle Name</Label>
              <FieldInput value={form.middleName} onChange={set('middleName')} placeholder="e.g. Santos (optional)" />
            </div>

            {/* Date of Birth */}
            <div>
              <Label required>Date of Birth</Label>
              <FieldInput value={form.dateOfBirth} onChange={set('dateOfBirth')} type="date" />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>

            {/* Gender */}
            <div>
              <Label required>Gender</Label>
              <SelectField
                value={form.gender}
                onChange={set('gender')}
                placeholder="Select Gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Prefer not to say', value: 'Prefer not to say' },
                ]}
              />
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>

            {/* Civil Status */}
            <div>
              <Label>Civil Status</Label>
              <SelectField
                value={form.civilStatus}
                onChange={set('civilStatus')}
                placeholder="Select Status"
                options={[
                  { label: 'Single', value: 'Single' },
                  { label: 'Married', value: 'Married' },
                  { label: 'Widowed', value: 'Widowed' },
                  { label: 'Separated', value: 'Separated' },
                ]}
              />
            </div>

            {/* Nationality */}
            <div>
              <Label>Nationality</Label>
              <FieldInput value={form.nationality} onChange={set('nationality')} placeholder="e.g. Filipino" />
            </div>

            {/* Occupation */}
            <div>
              <Label>Occupation</Label>
              <FieldInput value={form.occupation} onChange={set('occupation')} placeholder="e.g. Teacher" />
            </div>

            {/* PhilHealth */}
            <div>
              <Label>PhilHealth No.</Label>
              <FieldInput value={form.philhealthNumber} onChange={set('philhealthNumber')} placeholder="XX-XXXXXXXXX-X" />
            </div>
          </div>
        </div>

        {/* ── Contact Details ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader icon={Phone} title="Contact Details" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Contact Number</Label>
              <FieldInput value={form.contactNumber} onChange={set('contactNumber')} placeholder="+63 9XX XXX XXXX" />
              {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
            </div>
            <div>
              <Label>Email Address</Label>
              <FieldInput value={form.email} onChange={set('email')} type="email" placeholder="patient@email.com" />
            </div>
            <div className="sm:col-span-2">
              <Label required>Residential Address</Label>
              <textarea
                value={form.residentialAddress}
                onChange={e => set('residentialAddress')(e.target.value)}
                placeholder="Enter full address"
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
              />
              {errors.residentialAddress && <p className="text-xs text-red-500 mt-1">{errors.residentialAddress}</p>}
            </div>
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader icon={UserCheck} title="Emergency Contact" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label>Full Name</Label>
              <FieldInput value={form.emergencyName} onChange={set('emergencyName')} placeholder="e.g. Maria Dela Cruz" />
            </div>
            <div>
              <Label>Relationship</Label>
              <SelectField
                value={form.emergencyRelationship}
                onChange={set('emergencyRelationship')}
                placeholder="Select"
                options={[
                  { label: 'Spouse', value: 'Spouse' },
                  { label: 'Parent', value: 'Parent' },
                  { label: 'Child', value: 'Child' },
                  { label: 'Sibling', value: 'Sibling' },
                  { label: 'Guardian', value: 'Guardian' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
            </div>
            <div>
              <Label>Contact Number</Label>
              <FieldInput value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="+63 9XX XXX XXXX" />
            </div>
          </div>
        </div>

        {/* ── Clinical Information ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader icon={HeartPulse} title="Clinical Information" />

          <div className="space-y-4">
            {/* Chief Complaint */}
            <div>
              <Label>Chief Complaint / Reason for Visit</Label>
              <textarea
                value={form.chiefComplaint}
                onChange={e => set('chiefComplaint')(e.target.value)}
                placeholder="Describe the primary symptom or reason for the chest X-ray..."
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Medical History checkboxes */}
            <div>
              <Label>Relevant Medical History</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {MEDICAL_HISTORY_OPTIONS.map(item => {
                  const checked = form.medicalHistory.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleHistory(item)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left',
                        checked
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                        checked ? 'bg-teal-500 border-teal-500' : 'border-slate-300'
                      )}>
                        {checked && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Known Allergies</Label>
                <FieldInput value={form.allergies} onChange={set('allergies')} placeholder="e.g. Penicillin, Sulfa drugs" />
              </div>
              <div>
                <Label>Smoking Status</Label>
                <SelectField
                  value={form.smokingStatus}
                  onChange={set('smokingStatus')}
                  placeholder="Select"
                  options={[
                    { label: 'Non-smoker', value: 'Non-smoker' },
                    { label: 'Former smoker', value: 'Former smoker' },
                    { label: 'Current smoker', value: 'Current smoker' },
                  ]}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Current Medications</Label>
                <textarea
                  value={form.currentMedications}
                  onChange={e => set('currentMedications')(e.target.value)}
                  placeholder="List any ongoing medications and dosages..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Referral ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader icon={AlertCircle} title="Referral Information" />
          <div>
            <Label>Referring Physician</Label>
            <FieldInput value={form.referringPhysician} onChange={set('referringPhysician')} placeholder="Dr. Full Name (optional)" />
          </div>
        </div>

        {/* ── Required note ── */}
        <p className="text-xs text-slate-400">Fields marked with <span className="text-red-500">*</span> are required.</p>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Save Patient Record
          </button>
        </div>
      </form>
    </div>
  );
}
