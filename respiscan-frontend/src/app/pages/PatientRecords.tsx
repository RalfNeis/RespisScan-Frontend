import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, Filter, ChevronDown, User, Phone, MapPin, HeartPulse, AlertCircle, UserCheck, Check, X, ZoomIn, ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useNavigate } from 'react-router';
import { api } from '../utils/api';
import { cn } from '../utils/cn';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  age: number | null;
  gender: string;
  last_scan_date: string | null;
  status: string;
  
  civil_status?: string;
  nationality?: string;
  occupation?: string;
  philhealth_number?: string;
  contact_number?: string;
  email?: string;
  residential_address?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_number?: string;
  chief_complaint?: string;
  medical_history?: string[] | string;
  allergies?: string;
  current_medications?: string;
  smoking_status?: string;
  referring_physician?: string;
}

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
  value, onChange, placeholder, type = 'text', disabled, onFocus
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; onFocus?: () => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
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

export function PatientRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Scan History Modal state
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [selectedPatientForScans, setSelectedPatientForScans] = useState<Patient | null>(null);
  const [patientScans, setPatientScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const navigate = useNavigate();

  const fetchPatients = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (genderFilter) params.append('gender', genderFilter);
    if (ageMin) params.append('age_min', ageMin);
    if (ageMax) params.append('age_max', ageMax);
    params.append('ordering', 'name');
    params.append('page', currentPage.toString());

    const qs = params.toString();
    api.get(`/patients/${qs ? '?' + qs : ''}`)
      .then((res: any) => {
        if (res.results !== undefined) {
          setPatients(res.results);
          setTotalCount(res.count);
          setNextUrl(res.next);
          setPrevUrl(res.previous);
        } else {
          setPatients(Array.isArray(res) ? res : []);
          setTotalCount(Array.isArray(res) ? res.length : 0);
          setNextUrl(null);
          setPrevUrl(null);
        }
      })
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm, genderFilter, ageMin, ageMax]);

  const clearFilters = () => {
    setGenderFilter('');
    setAgeMin('');
    setAgeMax('');
    setCurrentPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearchTerm(v);
    setCurrentPage(1);
  };

  const hasActiveFilters = genderFilter || ageMin || ageMax;

  // --- Edit handlers ---
  const openEditModal = (pt: Patient) => {
    setEditPatient(pt);
    
    // Parse medical history
    let parsedHistory: string[] = [];
    if (Array.isArray(pt.medical_history)) {
      parsedHistory = pt.medical_history;
    } else if (typeof pt.medical_history === 'string') {
      try {
        parsedHistory = JSON.parse(pt.medical_history);
        if (!Array.isArray(parsedHistory)) parsedHistory = [];
      } catch {
        parsedHistory = pt.medical_history.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    setEditForm({
      name: pt.name || '',
      age: pt.age?.toString() ?? '',
      gender: pt.gender || '',
      civil_status: pt.civil_status || '',
      nationality: pt.nationality || 'Filipino',
      occupation: pt.occupation || '',
      philhealth_number: pt.philhealth_number || '',
      contact_number: pt.contact_number || '',
      email: pt.email || '',
      residential_address: pt.residential_address || '',
      emergency_contact_name: pt.emergency_contact_name || '',
      emergency_contact_relationship: pt.emergency_contact_relationship || '',
      emergency_contact_number: pt.emergency_contact_number || '',
      chief_complaint: pt.chief_complaint || '',
      medical_history: parsedHistory,
      allergies: pt.allergies || '',
      current_medications: pt.current_medications || '',
      smoking_status: pt.smoking_status || '',
      referring_physician: pt.referring_physician || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const setFormVal = (field: string) => (value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleHistory = (item: string) => {
    setEditForm((f: any) => ({
      ...f,
      medical_history: f.medical_history.includes(item)
        ? f.medical_history.filter((h: string) => h !== item)
        : [...f.medical_history, item],
    }));
  };

  const handleEditSave = async () => {
    if (!editPatient) return;
    setEditSaving(true);
    setEditError('');
    try {
      const payload = { ...editForm, age: editForm.age ? parseInt(editForm.age) : null };
      await api.patch(`/patients/${editPatient.id}/`, payload);
      setShowEditModal(false);
      setEditPatient(null);
      fetchPatients();
    } catch (e: any) {
      setEditError(e.message || 'Failed to update patient');
    } finally {
      setEditSaving(false);
    }
  };

  // --- Delete handlers ---
  const openDeleteDialog = (pt: Patient) => {
    setDeletePatient(pt);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletePatient) return;
    setDeleting(true);
    try {
      await api.delete(`/patients/${deletePatient.id}/`);
      setShowDeleteDialog(false);
      setDeletePatient(null);
      fetchPatients();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  // --- Scan History handlers ---
  const openPatientScanHistory = async (pt: Patient) => {
    setSelectedPatientForScans(pt);
    setShowScanHistory(true);
    setScansLoading(true);
    setPatientScans([]);
    try {
      const res: any = await api.get(`/patients/${pt.id}/history/`);
      if (res && res.scans) {
        setPatientScans(res.scans);
      } else {
        const fallback: any = await api.get(`/diagnostics/scans/?patient__id=${pt.id}`);
        setPatientScans(Array.isArray(fallback) ? fallback : fallback.results ?? []);
      }
    } catch {
      try {
        const fallback: any = await api.get(`/diagnostics/scans/?patient__id=${pt.id}`);
        setPatientScans(Array.isArray(fallback) ? fallback : fallback.results ?? []);
      } catch {
        setPatientScans([]);
      }
    } finally {
      setScansLoading(false);
    }
  };

  const sortedAndFilteredPatients = patients
    .filter((pt) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const idMatches = pt.patient_id.toLowerCase().startsWith(term);
      const nameMatches = pt.name.toLowerCase().startsWith(term);
      return idMatches || nameMatches;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Records</h2>
          <p className="text-slate-500">Manage patient information and historical scans.</p>
        </div>
        <Button className="shrink-0 gap-2" onClick={() => navigate('/patients/new')}>
          <Plus className="h-4 w-4" />
          Register Patient
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="max-w-md w-full">
              <Input
                placeholder="Search by Patient ID or Name..."
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className={`gap-2 ${hasActiveFilters ? 'border-teal-500 text-teal-700 bg-teal-50' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters {hasActiveFilters && '•'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 underline">
                Clear filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Gender</label>
                <select
                  value={genderFilter}
                  onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Min Age</label>
                <input
                  type="number"
                  value={ageMin}
                  onChange={(e) => { setAgeMin(e.target.value); setCurrentPage(1); }}
                  placeholder="e.g. 18"
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Age</label>
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => { setAgeMax(e.target.value); setCurrentPage(1); }}
                  placeholder="e.g. 65"
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Patient ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Age / Gender</th>
                <th className="px-6 py-4 font-medium">Last Scan Date</th>
                <th className="px-6 py-4 font-medium">Recent Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : sortedAndFilteredPatients.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No patients found. Register your first patient to get started.</td></tr>
              ) : sortedAndFilteredPatients.map((pt) => (
                <tr key={pt.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                  <td className="px-6 py-4 font-medium text-slate-900">{pt.patient_id}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <button onClick={() => openPatientScanHistory(pt)} className="text-teal-600 hover:text-teal-800 hover:underline font-medium text-left">
                      {pt.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{pt.age ?? '—'} / {pt.gender || '—'}</td>
                  <td className="px-6 py-4 text-slate-700">{pt.last_scan_date ? new Date(pt.last_scan_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pt.status === 'Positive' ? 'bg-red-100 text-red-800' :
                      pt.status === 'Negative' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50" 
                        onClick={() => navigate('/diagnosis', { state: { selectedPatientId: pt.id, selectedPatientName: pt.name, patientCode: pt.patient_id } })}
                      >
                        <FileText className="h-4 w-4 mr-1" /> Scan
                      </Button>
                      <button onClick={() => openEditModal(pt)} title="Edit"
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDeleteDialog(pt)} title="Delete"
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <p>
            Showing {patients.length} record{patients.length !== 1 ? 's' : ''} {totalCount > 0 && `of ${totalCount} total`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevUrl || loading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextUrl || loading}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Patient Scan History Modal */}
      {showScanHistory && selectedPatientForScans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-teal-600" />
                  Historical Scans & Heatmaps
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Showing historical AI diagnostics for <span className="font-semibold text-slate-700">{selectedPatientForScans.name}</span> ({selectedPatientForScans.patient_id})
                </p>
              </div>
              <button 
                onClick={() => setShowScanHistory(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {scansLoading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
                  <p className="text-sm">Loading historical scans from secure storage...</p>
                </div>
              ) : patientScans.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No scan history found for this patient.</p>
                  <p className="text-xs text-slate-400 mt-1">Upload and analyze a chest X-ray in Diagnose CXR to generate their first report.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {patientScans.map((scan: any, idx: number) => {
                    const scanDate = scan.upload_timestamp || scan.created_at || scan.diagnosis_date;
                    const confidencePercent = scan.confidence !== null && scan.confidence !== undefined
                      ? (scan.confidence <= 1 ? (scan.confidence * 100).toFixed(1) : Number(scan.confidence).toFixed(1)) + '%'
                      : null;

                    return (
                      <div key={scan.scan_id || scan.id || idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        {/* Scan Card Header */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900 text-sm">
                              Scan #{scan.scan_id || scan.id || idx + 1}
                            </span>
                            <span className="text-xs text-slate-500">
                              {scanDate ? new Date(scanDate).toLocaleString() : 'Date N/A'}
                            </span>
                            {scan.uploaded_by && (
                              <span className="text-xs text-slate-400">
                                • Uploaded by: {scan.uploaded_by}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {confidencePercent && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {confidencePercent} Confidence
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              scan.status === 'Positive' ? 'bg-red-100 text-red-700 border border-red-200' :
                              scan.status === 'Negative' ? 'bg-green-100 text-green-700 border border-green-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {scan.status || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Images Grid */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Original CXR */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                              <span>Original Chest X-Ray</span>
                              {scan.original_image_url && (
                                <span className="text-[11px] text-teal-600 lowercase font-normal flex items-center gap-0.5">
                                  <ZoomIn className="h-3 w-3" /> click to expand
                                </span>
                              )}
                            </p>
                            <div 
                              onClick={() => scan.original_image_url && setPreviewImage({ url: scan.original_image_url, title: `Original Chest X-Ray - ${selectedPatientForScans.name}` })}
                              className={`h-56 rounded-lg border border-slate-200 bg-slate-950 flex items-center justify-center overflow-hidden relative group ${scan.original_image_url ? 'cursor-pointer' : ''}`}
                            >
                              {scan.original_image_url ? (
                                <>
                                  <img 
                                    src={scan.original_image_url} 
                                    alt="Original CXR" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200" 
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                                    <ZoomIn className="h-4 w-4" /> Expand Image
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-slate-500 p-4">
                                  <ImageIcon className="h-8 w-8 mx-auto mb-1 text-slate-600" />
                                  <p className="text-xs">Original image not available</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Grad-CAM Heatmap */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                              <span>Grad-CAM AI Heatmap</span>
                              {scan.heatmap_image_url && (
                                <span className="text-[11px] text-teal-600 lowercase font-normal flex items-center gap-0.5">
                                  <ZoomIn className="h-3 w-3" /> click to expand
                                </span>
                              )}
                            </p>
                            <div 
                              onClick={() => scan.heatmap_image_url && setPreviewImage({ url: scan.heatmap_image_url, title: `Grad-CAM Pneumonia Heatmap - ${selectedPatientForScans.name}` })}
                              className={`h-56 rounded-lg border border-slate-200 bg-slate-950 flex items-center justify-center overflow-hidden relative group ${scan.heatmap_image_url ? 'cursor-pointer' : ''}`}
                            >
                              {scan.heatmap_image_url ? (
                                <>
                                  <img 
                                    src={scan.heatmap_image_url} 
                                    alt="Grad-CAM Heatmap" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200" 
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                                    <ZoomIn className="h-4 w-4" /> Expand Heatmap
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-slate-500 p-4">
                                  <HeartPulse className="h-8 w-8 mx-auto mb-1 text-slate-600" />
                                  <p className="text-xs font-medium text-slate-400">Heatmap overlay not generated</p>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    {scan.status === 'Negative' ? 'No activation regions detected' : 'Inference pending or unavailable'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Findings / Radiologist Notes */}
                        {(scan.radiologist_notes || scan.findings) && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/30 text-xs">
                            <p className="font-semibold text-slate-700">Radiologist Notes / Findings:</p>
                            <p className="text-slate-600 mt-0.5 whitespace-pre-wrap">{scan.radiologist_notes || scan.findings}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end shrink-0 bg-slate-50/50">
              <Button onClick={() => setShowScanHistory(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="w-full max-w-4xl flex items-center justify-between text-white pb-3 px-2">
            <p className="font-medium text-sm">{previewImage.title}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[82vh] max-w-[90vw] flex items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black">
            <img 
              src={previewImage.url} 
              alt={previewImage.title} 
              className="max-h-[82vh] max-w-[90vw] object-contain" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Massive Edit Patient Modal */}
      {showEditModal && editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 shrink-0 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Patient Record</h3>
                <p className="text-sm text-slate-500 mt-1">Update details for {editPatient.patient_id}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditPatient(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
              {editError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{editError}</p>}
              
              {/* Personal Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <SectionHeader icon={User} title="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label required>Full Name</Label>
                    <FieldInput value={editForm.name} onChange={setFormVal('name')} />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <FieldInput value={editForm.age} onChange={setFormVal('age')} type="number" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <SelectField
                      value={editForm.gender}
                      onChange={setFormVal('gender')}
                      options={[
                        { label: 'Male', value: 'Male' },
                        { label: 'Female', value: 'Female' },
                        { label: 'Prefer not to say', value: 'Prefer not to say' },
                      ]}
                    />
                  </div>
                  <div>
                    <Label>Civil Status</Label>
                    <SelectField
                      value={editForm.civil_status}
                      onChange={setFormVal('civil_status')}
                      placeholder="Select Status"
                      options={[
                        { label: 'Single', value: 'Single' },
                        { label: 'Married', value: 'Married' },
                        { label: 'Widowed', value: 'Widowed' },
                        { label: 'Separated', value: 'Separated' },
                      ]}
                    />
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <FieldInput value={editForm.nationality} onChange={setFormVal('nationality')} />
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <FieldInput value={editForm.occupation} onChange={setFormVal('occupation')} />
                  </div>
                  <div>
                    <Label>PhilHealth No.</Label>
                    <FieldInput value={editForm.philhealth_number} onChange={setFormVal('philhealth_number')} />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <SectionHeader icon={Phone} title="Contact Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Number</Label>
                    <FieldInput value={editForm.contact_number} onChange={setFormVal('contact_number')} />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <FieldInput value={editForm.email} onChange={setFormVal('email')} type="email" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Residential Address</Label>
                    <textarea
                      value={editForm.residential_address}
                      onChange={e => setFormVal('residential_address')(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <SectionHeader icon={UserCheck} title="Emergency Contact" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Full Name</Label>
                    <FieldInput value={editForm.emergency_contact_name} onChange={setFormVal('emergency_contact_name')} />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <SelectField
                      value={editForm.emergency_contact_relationship}
                      onChange={setFormVal('emergency_contact_relationship')}
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
                    <FieldInput value={editForm.emergency_contact_number} onChange={setFormVal('emergency_contact_number')} />
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <SectionHeader icon={HeartPulse} title="Clinical Information" />
                <div className="space-y-4">
                  <div>
                    <Label>Chief Complaint / Reason for Visit</Label>
                    <textarea
                      value={editForm.chief_complaint}
                      onChange={e => setFormVal('chief_complaint')(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                  <div>
                    <Label>Relevant Medical History</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      {MEDICAL_HISTORY_OPTIONS.map(item => {
                        const checked = editForm.medical_history.includes(item);
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
                      <FieldInput value={editForm.allergies} onChange={setFormVal('allergies')} />
                    </div>
                    <div>
                      <Label>Smoking Status</Label>
                      <SelectField
                        value={editForm.smoking_status}
                        onChange={setFormVal('smoking_status')}
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
                        value={editForm.current_medications}
                        onChange={e => setFormVal('current_medications')(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <SectionHeader icon={AlertCircle} title="Referral Information" />
                <div>
                  <Label>Referring Physician</Label>
                  <FieldInput value={editForm.referring_physician} onChange={setFormVal('referring_physician')} />
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditPatient(null); }} disabled={editSaving}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Patient Record</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete the record for <strong>{deletePatient.name}</strong> ({deletePatient.patient_id})?
                This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeletePatient(null); }} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
