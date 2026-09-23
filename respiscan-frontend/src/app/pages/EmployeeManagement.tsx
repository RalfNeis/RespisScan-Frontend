import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface Employee {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  title: string;
  department: string;
  license_number: string;
  bio?: string;
  is_active: boolean;
  date_joined: string;
}

const EMPTY_FORM = {
  username: '', email: '', first_name: '', last_name: '',
  role: 'employee', title: '', department: '', license_number: '', bio: '', password: '',
};

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const fetchEmployees = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    const qs = params.toString();
    api.get(`/auth/employees/${qs ? '?' + qs : ''}`)
      .then((res: any) => setEmployees(Array.isArray(res) ? res : res.results ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, [searchTerm]);

  const handleAdd = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/employees/', formData);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      fetchEmployees();
    } catch (e: any) {
      setError(e.body?.username?.[0] || e.body?.email?.[0] || e.message || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    setError('');
    try {
      const { password, ...rest } = formData;
      const payload = password ? { ...rest, password } : rest;
      await api.patch(`/auth/employees/${selectedEmployee.id}/`, payload);
      setShowEditModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (e: any) {
      setError(e.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      await api.delete(`/auth/employees/${selectedEmployee.id}/`);
      setShowDeleteDialog(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (emp: Employee) => {
    await api.post(`/auth/employees/${emp.id}/approve/`);
    fetchEmployees();
  };

  const handleDeactivate = async (emp: Employee) => {
    await api.post(`/auth/employees/${emp.id}/deactivate/`);
    fetchEmployees();
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({
      username: emp.username, email: emp.email, first_name: emp.first_name,
      last_name: emp.last_name, role: emp.role, title: emp.title,
      department: emp.department, license_number: emp.license_number || '',
      bio: emp.bio || '', password: '',
    });
    setError('');
    setShowEditModal(true);
  };

  const openDeleteDialog = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowDeleteDialog(true);
  };

  if (user?.role !== 'admin') return null;

  const showFormModal = showAddModal || showEditModal;
  const formTitle = showAddModal ? 'Add New Employee' : 'Edit Employee';
  const formOnSubmit = showAddModal ? handleAdd : handleEdit;
  const formOnClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedEmployee(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Management</h2>
          <p className="text-slate-500">Add, edit, and manage system user access.</p>
        </div>
        <Button className="shrink-0 gap-2" onClick={() => { setFormData(EMPTY_FORM); setError(''); setShowAddModal(true); }}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
          <div className="max-w-md w-full">
            <Input
              placeholder="Search by name, username, or department..."
              icon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">License No.</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No employees found.</td></tr>
              ) : employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setSelectedEmployee(emp); setShowProfileModal(true); }}
                      className="font-medium text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-2 text-left transition-colors"
                    >
                      {emp.first_name} {emp.last_name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{emp.username}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize">{emp.role}</td>
                  <td className="px-6 py-4 text-slate-700">{emp.department || '—'}</td>
                  <td className="px-6 py-4 text-slate-700 font-mono text-xs">{emp.license_number || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!emp.is_active && (
                        <button onClick={() => handleApprove(emp)} title="Approve"
                          className="p-2 text-green-500 hover:text-green-700 transition-colors">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {emp.is_active && (
                        <button onClick={() => handleDeactivate(emp)} title="Deactivate"
                          className="p-2 text-yellow-500 hover:text-yellow-700 transition-colors">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openEditModal(emp)} title="Edit"
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDeleteDialog(emp)} title="Delete"
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
          <p>Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
      </Card>

      {/* Add / Edit Employee Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">{formTitle}</h3>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">First Name *</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Last Name *</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Username *</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Position / Title</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Radiologic Technologist" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">PRC License No.</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="e.g. 0012345" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Biography / Notes</label>
                <textarea rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                  placeholder="Short description, qualifications, or notes..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Password {showEditModal ? '(leave blank to keep current)' : '*'}
                </label>
                <input type="password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={formOnClose} disabled={saving}>Cancel</Button>
              <Button onClick={formOnSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Deactivation</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to deactivate <strong>{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>?
                They will no longer be able to log in.
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedEmployee(null); }} disabled={saving}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={saving}>
                {saving ? 'Processing...' : 'Deactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {showProfileModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-32 bg-slate-900 overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500 via-slate-900 to-slate-900"></div>
              <button 
                onClick={() => { setShowProfileModal(false); setSelectedEmployee(null); }}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-all z-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="-mt-16 mb-4 flex items-end justify-between relative z-10">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg shrink-0">
                  <img 
                    src={selectedEmployee.role === 'admin' 
                      ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3ODE3OTQzMjB8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                      : "https://images.unsplash.com/photo-1594824406567-b50e326c07a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXJzZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MTc5NDMyMHww&ixlib=rb-4.1.0&q=80&w=1080"} 
                    alt={selectedEmployee.first_name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="pb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedEmployee.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-teal-100 text-teal-700 border border-teal-200'
                  }`}>
                    {selectedEmployee.role}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{selectedEmployee.title || 'Staff Member'}</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</span>
                    <span className="text-sm text-slate-700 mt-0.5">{selectedEmployee.email}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Department</span>
                      <span className="text-sm text-slate-700 mt-0.5">{selectedEmployee.department || 'Not assigned'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">License / ID</span>
                      <span className="text-sm font-mono text-slate-700 mt-0.5">{selectedEmployee.license_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-3">Biography & Notes</span>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedEmployee.bio || 'No biography provided for this employee.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
