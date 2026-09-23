import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Filter, X, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { api } from '../utils/api';

interface DashboardData {
  total_patients: number;
  total_scans: number;
  positive_detections: number;
  reports_generated: number;
  scan_growth_percent: number;
  weekly_activity: { name: string; scans: number; positive: number }[];
  recent_activity: { action: string; patient_id: string; minutes_ago: number }[];
  gender_distribution: { name: string; value: number }[];
  age_pneumonia: { range: string; positive: number; total: number }[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

            </div>

            {/* Right Column (Activity Feed) */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Recent Activity</CardTitle>
                </div>
                <button className="text-xs font-medium text-teal-600 hover:text-teal-700">View All</button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                    <div key={i} className="flex justify-between items-start group">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">{item.patient_id}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                          <p className="text-xs text-slate-500">{item.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {item.minutes_ago < 60 
                          ? `${item.minutes_ago}m ago` 
                          : `${Math.floor(item.minutes_ago / 60)}h ago`}
                      </span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400">No recent activity</p>
                  )}
                  
                  {/* System Update mock item */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-start">
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
    </div>
  );
}
