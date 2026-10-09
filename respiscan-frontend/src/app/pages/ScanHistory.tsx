import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, FileText, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../utils/api';

interface Scan {
  id: number;
  patient_name: string;
  patient_id_code: string;
  upload_timestamp: string;
  diagnosis: {
    detection_result: string;
    model_confidence: number;
  };
}

export function ScanHistory() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const ptId = searchParams.get('patient_id');
    if (ptId) setSearchTerm(ptId);
  }, [searchParams]);

  const fetchScans = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter) params.append('diagnosis__detection_result', statusFilter);
    const uploadedBy = searchParams.get('uploaded_by');
    if (uploadedBy) params.append('uploaded_by', uploadedBy);
    params.append('page', page.toString());
    
    api.get(`/diagnostics/scans/?${params.toString()}`)
      .then((res: any) => {
        setScans(res.results || []);
        setTotalRecords(res.count || 0);
        setTotalPages(Math.ceil((res.count || 0) / 25) || 1);
      })
      .catch(() => setScans([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans();
  }, [searchTerm, statusFilter, page]);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Scan History</h2>
          <p className="text-slate-500">Comprehensive log of all AI diagnostics run.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="max-w-md w-full">
              <Input
                placeholder="Search by Patient Name or ID..."
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <Button
              variant="outline"
              className={`gap-2 ${statusFilter ? 'border-teal-500 text-teal-700 bg-teal-50' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters {statusFilter && '•'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {statusFilter && (
              <button onClick={() => { setStatusFilter(''); setPage(1); }} className="text-xs text-slate-500 hover:text-slate-700 underline">
                Clear filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Detection Result</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : scans.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No scans found.</td></tr>
              ) : scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                  <td className="px-6 py-4 text-slate-700">{new Date(scan.upload_timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{scan.patient_name} <span className="text-slate-400 text-xs ml-1 font-normal">({scan.patient_id_code})</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scan.diagnosis.detection_result === 'Positive' ? 'bg-red-100 text-red-800' :
                      scan.diagnosis.detection_result === 'Negative' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {scan.diagnosis.detection_result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {scan.diagnosis.model_confidence ? (scan.diagnosis.model_confidence * 100).toFixed(1) + '%' : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={() => navigate(`/diagnosis?scan_id=${scan.id}`)}>
                      <FileText className="h-4 w-4 mr-1" /> Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{scans.length}</span> of <span className="font-medium text-slate-900">{totalRecords}</span> records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 px-2">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
