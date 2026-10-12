import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Filter, X, TrendingUp, ChevronRight, ZoomIn, Image as ImageIcon, ArrowRight, HeartPulse } from 'lucide-react';
import { Button } from '../components/ui/button';
import { api } from '../utils/api';

export interface RecentActivityItem {
  action: string;
  patient_id: string;
  patient_name?: string;
  patient_pk?: number;
  gender?: string;
  age?: number;
  detection_result?: string;
  minutes_ago: number;
}

interface DashboardData {
  total_patients: number;
  total_scans: number;
  positive_detections: number;
  reports_generated: number;
  scan_growth_percent: number;
  weekly_activity: { name: string; scans: number; positive: number }[];
  recent_activity: RecentActivityItem[];
  gender_distribution: { name: string; value: number }[];
  age_pneumonia: { range: string; positive: number; total: number }[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Patient Scan History Modal state
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<{
    id: number;
    name: string;
    patient_id: string;
    age?: number;
    gender?: string;
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [patientScans, setPatientScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const handleOpenPatientHistory = async (item: RecentActivityItem) => {
    const lookupId = item.patient_pk || item.patient_id;
    if (!lookupId) return;

    setSelectedPatientForHistory({
      id: item.patient_pk || 0,
      name: item.patient_name || item.patient_id,
      patient_id: item.patient_id,
      age: item.age,
      gender: item.gender,
    });
    setShowHistoryModal(true);
    setScansLoading(true);
    setPatientScans([]);

    try {
      const res: any = await api.get(`/patients/${lookupId}/history/`);
      if (res && Array.isArray(res.scans)) {
        setPatientScans(res.scans);
        if (res.name) {
          setSelectedPatientForHistory(prev => prev ? { ...prev, name: res.name } : null);
        }
      } else if (Array.isArray(res)) {
        setPatientScans(res);
      } else if (res && res.results) {
        setPatientScans(res.results);
      } else if (item.patient_pk) {
        const fallback: any = await api.get(`/diagnostics/scans/?patient__id=${item.patient_pk}`);
        setPatientScans(Array.isArray(fallback) ? fallback : fallback.results ?? []);
      }
    } catch {
      if (item.patient_pk) {
        try {
          const fallback: any = await api.get(`/diagnostics/scans/?patient__id=${item.patient_pk}`);
          setPatientScans(Array.isArray(fallback) ? fallback : fallback.results ?? []);
        } catch {
          setPatientScans([]);
        }
      } else {
        setPatientScans([]);
      }
    } finally {
      setScansLoading(false);
    }
  };

  // Filter state
  const [gender, setGender] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ gender: '', ageMin: '', ageMax: '' });

  const fetchData = useCallback((filters: { gender: string; ageMin: string; ageMax: string }) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.ageMin) params.append('age_min', filters.ageMin);
    if (filters.ageMax) params.append('age_max', filters.ageMax);
    const qs = params.toString();
    api.get(`/analytics/dashboard/${qs ? '?' + qs : ''}`)
      .then((res: DashboardData) => setData(res))
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

  const chartData = data?.weekly_activity ?? [];
  const recentActivity = data?.recent_activity ?? [];
  const agePneumonia = data?.age_pneumonia ?? [];
  const genderDist = data?.gender_distribution ?? [];

  const maleCount = genderDist.find(g => g.name === 'Male')?.value ?? 0;
  const femaleCount = genderDist.find(g => g.name === 'Female')?.value ?? 0;
  const totalPatients = data?.total_patients ?? 0;
  const totalScans = data?.total_scans ?? 0;
  const positiveDetections = data?.positive_detections ?? 0;
  const reportsGenerated = data?.reports_generated ?? 0;
  
  const positivityRate = totalScans > 0 ? ((positiveDetections / totalScans) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Portal</h2>
          <p className="text-slate-500 mt-1">System summary and recent diagnostic activity.</p>
        </div>
        
        {/* Inline Filter Bar to save space */}
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
            <input
              type="number" min={0} max={120} value={ageMin} onChange={e => setAgeMin(e.target.value)}
              placeholder="0" className="w-12 px-1 py-1 text-center border-b border-slate-200 focus:outline-none focus:border-teal-500 bg-transparent"
            />
            <span>-</span>
            <input
              type="number" min={0} max={120} value={ageMax} onChange={e => setAgeMax(e.target.value)}
              placeholder="120" className="w-12 px-1 py-1 text-center border-b border-slate-200 focus:outline-none focus:border-teal-500 bg-transparent"
            />
          </div>
          
          <Button size="sm" onClick={applyFilters} className="px-4">
            Apply
          </Button>
          
          {(appliedFilters.gender || appliedFilters.ageMin || appliedFilters.ageMax) && (
            <button onClick={clearFilters} className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading dashboard data...</div>
      ) : (
        <>
          {/* ── Top 4 Metric Cards (Horizontal Layout) ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Registered</p>
                  <p className="text-4xl font-bold text-slate-900">{totalPatients}</p>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Male ({maleCount})</span>
                    <span>Female ({femaleCount})</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    <div className="bg-blue-400 h-full transition-all" style={{ width: `${totalPatients > 0 ? (maleCount / totalPatients) * 100 : 0}%` }} />
                    <div className="bg-pink-400 h-full transition-all" style={{ width: `${totalPatients > 0 ? (femaleCount / totalPatients) * 100 : 0}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">CXR Scans Processed</p>
                  <p className="text-4xl font-bold text-slate-900">{totalScans}</p>
                </div>
                <div className={`mt-6 flex items-center text-xs font-medium w-fit px-2 py-0.5 rounded ${
                  (data?.scan_growth_percent ?? 0) >= 0 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${(data?.scan_growth_percent ?? 0) < 0 ? 'rotate-180' : ''}`} />
                  {(data?.scan_growth_percent ?? 0) > 0 ? '+' : ''}{data?.scan_growth_percent ?? 0}% this week
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 border-l-4 border-l-amber-500">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Positive Detections</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-slate-900">{positiveDetections}</p>
                    <p className="text-sm text-slate-400 font-medium">/ {totalScans} scans</p>
                  </div>
                </div>
                <div className="mt-6 text-[11px] font-medium text-slate-500">
                  {positivityRate}% Positivity Rate
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Reports Generated</p>
                  <p className="text-4xl font-bold text-slate-900">{reportsGenerated}</p>
                </div>
                <div className="mt-6 text-[11px] text-slate-400">
                  Pending automated generation
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── Main Content Area ────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column (Charts) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Weekly Scan Activity */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800">Weekly Scan Activity</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">Volume of scans processed over the last 7 days</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full mt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="scans" stroke="#14b8a6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#14b8a6', strokeWidth: 2, stroke: '#fff' }} name="Total Scans" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">No scan activity yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Age Range Chart */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800">Bacterial Pneumonia by Age Range</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">Positive detection count per age group</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full mt-4">
                    {agePneumonia.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agePneumonia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(value: number, name: string) => [value, name === 'positive' ? 'Positive Cases' : name]}
                          />
                          <Bar dataKey="positive" radius={[4, 4, 0, 0]} maxBarSize={32}>
                            {agePneumonia.map((entry, index) => (
                              <Cell key={index} fill={entry.positive > 0 ? '#0f172a' : '#e2e8f0'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column (Activity Feed) */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Recent Activity</CardTitle>
                </div>
                <button onClick={() => navigate('/scan-history')} className="text-xs font-medium text-teal-600 hover:text-teal-700">View All</button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleOpenPatientHistory(item)}
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200/80 group"
                      title={`Click to view scan history for ${item.patient_name || item.patient_id}`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-600 transition-colors truncate">
                          {item.patient_name || item.patient_id}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.patient_id}
                          </span>
                          <span className="text-slate-300">•</span>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            item.detection_result === 'Positive' ? 'bg-red-500' :
                            item.detection_result === 'Negative' ? 'bg-teal-500' :
                            'bg-amber-500'
                          }`} />
                          <p className="text-xs text-slate-500 truncate">{item.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {item.minutes_ago < 60 
                            ? `${item.minutes_ago}m ago` 
                            : `${Math.floor(item.minutes_ago / 60)}h ago`}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 p-2">No recent activity</p>
                  )}
                  
                  {/* System Update mock item */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-start px-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">System Update</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <p className="text-xs text-slate-500">Model accuracy updated to v2.4</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Yesterday</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      )}

      {/* Patient Scan History Modal */}
      {showHistoryModal && selectedPatientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-200">
                  <HeartPulse className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Historical Scans & Heatmaps
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Showing historical AI diagnostics for <span className="font-semibold text-slate-700">{selectedPatientForHistory.name}</span> ({selectedPatientForHistory.patient_id})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowHistoryModal(false);
                    navigate(`/diagnosis?patient_id=${selectedPatientForHistory.id}`);
                  }}
                  className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50 flex items-center gap-1.5"
                >
                  Diagnose CXR <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {scansLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
                  <p className="text-sm font-medium">Loading historical scans from secure storage...</p>
                </div>
              ) : patientScans.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700">No scan history found for this patient.</p>
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
                      <div key={scan.scan_id || scan.id || idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        {/* Scan Card Header */}
                        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
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
                              onClick={() => scan.original_image_url && setPreviewImage({ url: scan.original_image_url, title: `Original Chest X-Ray - ${selectedPatientForHistory.name}` })}
                              className={`h-52 rounded-lg border border-slate-200 bg-slate-950 flex items-center justify-center overflow-hidden relative group ${scan.original_image_url ? 'cursor-pointer' : ''}`}
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
                              onClick={() => scan.heatmap_image_url && setPreviewImage({ url: scan.heatmap_image_url, title: `Grad-CAM Pneumonia Heatmap - ${selectedPatientForHistory.name}` })}
                              className={`h-52 rounded-lg border border-slate-200 bg-slate-950 flex items-center justify-center overflow-hidden relative group ${scan.heatmap_image_url ? 'cursor-pointer' : ''}`}
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
                                    <ZoomIn className="h-4 w-4" /> Expand Image
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-slate-500 p-4">
                                  <ImageIcon className="h-8 w-8 mx-auto mb-1 text-slate-600" />
                                  <p className="text-xs">Heatmap not available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 flex flex-col items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="font-semibold text-sm truncate max-w-md">{previewImage.title}</span>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/25 transition-colors ml-4"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img 
              src={previewImage.url} 
              alt="Scan Preview" 
              className="max-h-[80vh] max-w-full object-contain rounded-lg border border-white/10 shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
