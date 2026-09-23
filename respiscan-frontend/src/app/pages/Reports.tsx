import { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, FileText, Filter, X, TrendingUp, TrendingDown, AlertTriangle, Info, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
import { api } from '../utils/api';

interface AnalyticsData {
  monthly_trends: { name: string; Scans: number; Positive: number; positivity_rate: number }[];
  distribution: { name: string; value: number; color: string }[];
  gender_distribution: { name: string; value: number }[];
  age_gender_distribution: { range: string; Male: number; Female: number }[];
  key_findings: { id: string; icon: string; type: string; title: string; description: string }[];
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
  
  // Custom Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState({ demo: true, trends: true, ai: true });

  // Drill-down State
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

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
      // For simplicity, we use api.post which handles the CSRF token automatically.
      await api.post('/reports/generate/', {
        date_range_start: startDate,
        date_range_end: endDate,
        config: exportConfig
      });
      fetchReports();
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const barData = data?.monthly_trends ?? [];
  const pieData = data?.distribution ?? [];
  const stackedDemographics = data?.age_gender_distribution ?? [];
  const keyFindings = data?.key_findings ?? [];
  
  // Filter reports if a month is clicked
  const filteredReports = selectedMonth 
    ? reports.filter(r => new Date(r.generated_at).toLocaleString('en-US', { month: 'short' }) === selectedMonth)
    : reports;

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
            <Button size="sm" className="gap-2 ml-2" onClick={() => setShowExportModal(true)} disabled={exporting}>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Diagnosis Trends {selectedMonth ? `(${selectedMonth})` : ''}</CardTitle>
                {selectedMonth && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(null)} className="h-8 text-xs text-slate-500 hover:text-slate-900">
                    Clear Selection
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar yAxisId="left" dataKey="Scans" fill="#0D9488" radius={[4, 4, 0, 0]} onClick={(data) => setSelectedMonth(data?.name)} className="cursor-pointer" />
                        <Bar yAxisId="left" dataKey="Positive" fill="#ef4444" radius={[4, 4, 0, 0]} onClick={(data) => setSelectedMonth(data?.name)} className="cursor-pointer" />
                        <Line yAxisId="right" type="monotone" dataKey="positivity_rate" name="Positivity %" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                      </ComposedChart>
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

          {/* ── Stacked Demographics & Key Findings ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Demographics (Age & Gender)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {stackedDemographics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stackedDemographics} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="Male" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} name="Male Cases" />
                        <Bar dataKey="Female" stackId="a" fill="#db2777" radius={[4, 4, 0, 0]} name="Female Cases" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No data yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Key Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyFindings.length > 0 ? (
                  keyFindings.map(finding => {
                    let Icon = Info;
                    let colorClass = 'text-blue-500 bg-blue-50';
                    if (finding.icon === 'TrendingUp') { Icon = TrendingUp; colorClass = 'text-slate-700 bg-slate-100'; }
                    if (finding.icon === 'TrendingDown') { Icon = TrendingDown; colorClass = 'text-teal-600 bg-teal-50'; }
                    if (finding.icon === 'AlertTriangle') { Icon = AlertTriangle; colorClass = 'text-amber-500 bg-amber-50'; }
                    
                    return (
                      <div key={finding.id} className="flex gap-3 items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className={`p-2 rounded-lg mt-0.5 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{finding.title}</p>
                          <p className="text-sm text-slate-500 mt-1">{finding.description}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">No significant findings detected.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Reports History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                Generated System Reports {selectedMonth ? `for ${selectedMonth}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <p className="text-sm text-slate-400 py-4">Loading report history...</p>
              ) : filteredReports.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No reports generated yet{selectedMonth ? ` for ${selectedMonth}` : ''}. Use the "Export PDF" button above to generate a report.</p>
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
                      {filteredReports.map((r) => (
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

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CheckSquare className="h-5 w-5 text-teal-600" /> Export Analytics Report</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 block mb-3">Include Sections in PDF:</label>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                  <input type="checkbox" id="inc-demo" checked={exportConfig.demo} onChange={e => setExportConfig(p => ({...p, demo: e.target.checked}))} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="inc-demo" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Demographics (Age & Gender)</label>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                  <input type="checkbox" id="inc-trends" checked={exportConfig.trends} onChange={e => setExportConfig(p => ({...p, trends: e.target.checked}))} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="inc-trends" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Monthly Trends & Growth</label>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                  <input type="checkbox" id="inc-ai" checked={exportConfig.ai} onChange={e => setExportConfig(p => ({...p, ai: e.target.checked}))} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="inc-ai" className="text-sm font-medium text-slate-700 cursor-pointer select-none">AI Confidence Scores</label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <Button variant="ghost" onClick={() => setShowExportModal(false)} className="text-slate-600 hover:text-slate-900">Cancel</Button>
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
