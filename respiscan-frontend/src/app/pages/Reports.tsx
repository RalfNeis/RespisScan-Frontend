import { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, FileText, Filter, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../utils/api';

interface AnalyticsData {
  monthly_trends: { name: string; Scans: number; Positive: number }[];
  distribution: { name: string; value: number; color: string }[];
  gender_distribution: { name: string; value: number }[];
}

interface ReportRecord {
  id: number;
  title: string;
  report_type: string;
  date_range_start: string | null;
  date_range_end: string | null;
  generated_by_name: string;
  generated_at: string;
}

export function Reports() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter state
  const [gender, setGender] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ gender: '', ageMin: '', ageMax: '' });

  // Date range for export
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchData = useCallback((filters: { gender: string; ageMin: string; ageMax: string }) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.ageMin) params.append('age_min', filters.ageMin);
    if (filters.ageMax) params.append('age_max', filters.ageMax);
    const qs = params.toString();
    
    api.get(`/analytics/dashboard/${qs ? '?' + qs : ''}`)
      .then((res: AnalyticsData) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(appliedFilters);
  }, [appliedFilters, fetchData]);

  const applyFilters = () => {
    setAppliedFilters({ gender, ageMin, ageMax });
  };

  const clearFilters = () => {
    setGender('');
    setAgeMin('');
    setAgeMax('');
    setAppliedFilters({ gender: '', ageMin: '', ageMax: '' });
  };

  const fetchReports = () => {
    setReportsLoading(true);
    api.get('/reports/')
      .then((res: any) => setReports(Array.isArray(res) ? res : res.results ?? []))
      .catch(() => setReports([]))
      .finally(() => setReportsLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/reports/generate/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await getCsrfToken(),
        },
        body: JSON.stringify({
          date_range_start: startDate,
          date_range_end: endDate,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respiscan_analytics_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Refresh the report history
      fetchReports();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const barData = data?.monthly_trends ?? [];
  const pieData = data?.distribution ?? [];
  const genderDist = data?.gender_distribution ?? [];

  const maleCount = genderDist.find(g => g.name === 'Male')?.value ?? 0;
  const femaleCount = genderDist.find(g => g.name === 'Female')?.value ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h2>
          <p className="text-slate-500">System analytics and comprehensive diagnostic reporting.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Inline Filter Bar */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500 pl-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>
            <select
              value={gender}
              onChange={e => {
                const newGender = e.target.value;
                setGender(newGender);
                setAppliedFilters(prev => ({ ...prev, gender: newGender }));
              }}
              className="px-2 py-1.5 text-sm border-none bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 px-2 text-sm text-slate-700">
              <span>Age:</span>
              <input type="number" min={0} max={120} value={ageMin} onChange={e => setAgeMin(e.target.value)} placeholder="0" className="w-12 px-1 py-1 text-center border-b border-slate-200 focus:outline-none focus:border-teal-500 bg-transparent" />
              <span>-</span>
              <input type="number" min={0} max={120} value={ageMax} onChange={e => setAgeMax(e.target.value)} placeholder="120" className="w-12 px-1 py-1 text-center border-b border-slate-200 focus:outline-none focus:border-teal-500 bg-transparent" />
            </div>
            <Button size="sm" onClick={applyFilters} className="px-4">Apply</Button>
            {(appliedFilters.gender || appliedFilters.ageMin || appliedFilters.ageMax) && (
              <button onClick={clearFilters} className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"><X className="h-4 w-4" /></button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1.5 text-sm border-none bg-transparent text-slate-700 focus:outline-none" />
            <span className="text-slate-400">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1.5 text-sm border-none bg-transparent text-slate-700 focus:outline-none" />
            <Button size="sm" className="gap-2 ml-2" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Diagnosis Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="Scans" fill="#0D9488" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Positive" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No data yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[250px] w-full">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No data yet</div>
                  )}
                </div>
                <div className="w-full mt-4 space-y-3">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-sm text-slate-500">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Gender Distribution ────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Male Patients</p>
                <p className="text-4xl font-bold text-slate-900">{maleCount.toLocaleString()}</p>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-700 rounded-full transition-all duration-500"
                    style={{ width: `${(maleCount + femaleCount) > 0 ? (maleCount / (maleCount + femaleCount)) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {(maleCount + femaleCount) > 0
                    ? `${((maleCount / (maleCount + femaleCount)) * 100).toFixed(1)}% of total patients`
                    : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Female Patients</p>
                <p className="text-4xl font-bold text-slate-900">{femaleCount.toLocaleString()}</p>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${(maleCount + femaleCount) > 0 ? (femaleCount / (maleCount + femaleCount)) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {(maleCount + femaleCount) > 0
                    ? `${((femaleCount / (maleCount + femaleCount)) * 100).toFixed(1)}% of total patients`
                    : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Generated Reports History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                Generated System Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <p className="text-sm text-slate-400 py-4">Loading report history...</p>
              ) : reports.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No reports generated yet. Use the "Export PDF" button above to generate your first report.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 pr-6 font-medium">Report Title</th>
                        <th className="py-3 pr-6 font-medium">Type</th>
                        <th className="py-3 pr-6 font-medium">Date Range</th>
                        <th className="py-3 pr-6 font-medium">Generated By</th>
                        <th className="py-3 pr-6 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pr-6 font-medium text-slate-900">{r.title}</td>
                          <td className="py-3 pr-6 text-slate-600 capitalize">{r.report_type}</td>
                          <td className="py-3 pr-6 text-slate-600">
                            {r.date_range_start && r.date_range_end
                              ? `${r.date_range_start} — ${r.date_range_end}`
                              : '—'}
                          </td>
                          <td className="py-3 pr-6 text-slate-600">{r.generated_by_name}</td>
                          <td className="py-3 pr-6 text-slate-500">{new Date(r.generated_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Helper to get CSRF token for the raw fetch call
async function getCsrfToken(): Promise<string> {
  const res = await fetch('/api/auth/csrf/', { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}
