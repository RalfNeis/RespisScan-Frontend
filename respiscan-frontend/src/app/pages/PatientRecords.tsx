import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, Filter, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useNavigate } from 'react-router';
import { api } from '../utils/api';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  age: number | null;
  gender: string;
  last_scan_date: string | null;
  status: string;
}

export function PatientRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ name: '', age: '', gender: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchPatients = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (genderFilter) params.append('gender', genderFilter);
    if (ageMin) params.append('age_min', ageMin);
    if (ageMax) params.append('age_max', ageMax);
    const qs = params.toString();
    api.get(`/patients/${qs ? '?' + qs : ''}`)
      .then((res: any) => {
        setPatients(Array.isArray(res) ? res : res.results ?? []);
      })
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, genderFilter, ageMin, ageMax]);

  const clearFilters = () => {
    setGenderFilter('');
    setAgeMin('');
    setAgeMax('');
  };

  const hasActiveFilters = genderFilter || ageMin || ageMax;

  // --- Edit handlers ---
  const openEditModal = (pt: Patient) => {
    setEditPatient(pt);
    setEditForm({
      name: pt.name,
      age: pt.age?.toString() ?? '',
      gender: pt.gender,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editPatient) return;
    setEditSaving(true);
    setEditError('');
    try {
      await api.patch(`/patients/${editPatient.id}/`, {
        name: editForm.name,
        age: editForm.age ? parseInt(editForm.age) : null,
        gender: editForm.gender,
      });
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setGenderFilter(e.target.value)}
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
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Age</label>
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
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
              ) : patients.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No patients found. Register your first patient to get started.</td></tr>
              ) : patients.map((pt) => (
                <tr key={pt.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                  <td className="px-6 py-4 font-medium text-slate-900">{pt.patient_id}</td>
                  <td className="px-6 py-4 text-slate-700">{pt.name}</td>
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
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={() => navigate('/diagnosis')}>
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
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <p>Showing {patients.length} record{patients.length !== 1 ? 's' : ''}</p>
        </div>
      </Card>

      {/* Edit Patient Modal */}
      {showEditModal && editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Edit Patient</h3>
              <p className="text-sm text-slate-500 mt-1">Update details for {editPatient.patient_id}</p>
            </div>
            <div className="p-6 space-y-4">
              {editError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{editError}</p>}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Age</label>
                  <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Gender</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
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
