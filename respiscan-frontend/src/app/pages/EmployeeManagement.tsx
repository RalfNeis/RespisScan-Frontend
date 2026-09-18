import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

const mockEmployees = [
  { id: 'EMP-001', name: 'Dr. Maria Santos', role: 'Administrator', department: 'Radiology', status: 'Active' },
  { id: 'EMP-002', name: 'Juan Dela Cruz', role: 'Radiologic Technologist', department: 'Imaging', status: 'Active' },
  { id: 'EMP-003', name: 'Ana Reyes', role: 'Pulmonologist', department: 'Respiratory', status: 'Inactive' },
  { id: 'EMP-004', name: 'Dr. Carlos Mendoza', role: 'Administrator', department: 'Management', status: 'Active' },
];

export function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Management</h2>
          <p className="text-slate-500">Add, edit, and manage system user access.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
          <div className="max-w-md w-full">
            <Input
              placeholder="Search by name or ID..."
              icon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent">
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Employee ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                  <td className="px-6 py-4 font-medium text-slate-900">{emp.id}</td>
                  <td className="px-6 py-4 text-slate-700">{emp.name}</td>
                  <td className="px-6 py-4 text-slate-700">{emp.role}</td>
                  <td className="px-6 py-4 text-slate-700">{emp.department}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
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
          <p>Showing 1 to 4 of 4 entries</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
