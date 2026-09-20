import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../utils/api';

interface DashboardData {
  total_patients: number;
  total_scans: number;
  positive_detections: number;
  reports_generated: number;
  weekly_activity: { name: string; scans: number; positive: number }[];
  recent_activity: { action: string; patient_id: string; minutes_ago: number }[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard/')
      .then((res: DashboardData) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = data?.weekly_activity ?? [];
  const recentActivity = data?.recent_activity ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 mt-1">System summary and recent diagnostic activity.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading dashboard data...</div>
      ) : (
        <>
          {/* Top Hierarchy Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Primary Metric Card */}
            <Card className="xl:col-span-2 bg-slate-900 text-white border-slate-800 shadow-lg">
              <CardContent className="p-8 sm:p-10">
                <div>
                  <div className="text-slate-400 mb-4">
                    <span className="font-medium tracking-wide uppercase text-xs">Total Registered Patients</span>
                  </div>
                  <p className="text-6xl sm:text-7xl font-bold tracking-tight">
                    {data?.total_patients?.toLocaleString() ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Secondary Metrics Stack */}
            <div className="flex flex-col gap-6 justify-between">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">CXR Scans Processed</p>
                  <p className="text-3xl font-bold text-slate-900">{data?.total_scans?.toLocaleString() ?? 0}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Positive Detections</p>
                  <p className="text-3xl font-bold text-slate-900">{data?.positive_detections?.toLocaleString() ?? 0}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Reports Generated</p>
                  <p className="text-3xl font-bold text-slate-900">{data?.reports_generated?.toLocaleString() ?? 0}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 shadow-sm">
              <CardHeader className="pb-8">
                <CardTitle className="text-lg">Weekly Scan Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="scans" stroke="#0f172a" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#0f172a' }} name="Total Scans" />
                        <Line type="monotone" dataKey="positive" stroke="#94a3b8" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#94a3b8' }} name="Positive Detections" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No scan activity yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.patient_id}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.action}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          {item.minutes_ago}m ago
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
