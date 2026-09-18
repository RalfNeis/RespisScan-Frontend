import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, FileText, Activity, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  const stats = [
    { label: 'Total Patients', value: data?.total_patients ?? 0, icon: Users, color: 'blue' },
    { label: 'CXR Scans Processed', value: data?.total_scans ?? 0, icon: Activity, color: 'teal' },
    { label: 'Positive Detections', value: data?.positive_detections ?? 0, icon: AlertCircle, color: 'red' },
    { label: 'Reports Generated', value: data?.reports_generated ?? 0, icon: FileText, color: 'purple' },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  };

  const chartData = data?.weekly_activity ?? [];
  const recentActivity = data?.recent_activity ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500">System summary and recent diagnostic activity.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading dashboard data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const colors = colorMap[stat.color];
              return (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={`h-12 w-12 ${colors.bg} rounded-full flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Scan Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs key="defs">
                          <linearGradient key="grad-scans" id="colorScans" x1="0" y1="0" x2="0" y2="1">
                            <stop key="scan-5" offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                            <stop key="scan-95" offset="95%" stopColor="#0D9488" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient key="grad-pos" id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                            <stop key="pos-5" offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop key="pos-95" offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis key="xaxis" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis key="yaxis" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip
                          key="tooltip"
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area key="area-scans" type="monotone" dataKey="scans" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" name="Total Scans" />
                        <Area key="area-positive" type="monotone" dataKey="positive" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPositive)" name="Positive Detections" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No scan activity yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="relative mt-1">
                        <div className="absolute top-0 bottom-0 left-1.5 w-0.5 bg-slate-200 -z-10" />
                        <div className="h-3 w-3 rounded-full bg-teal-500 ring-4 ring-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Patient ID: {item.patient_id}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.minutes_ago} minutes ago</p>
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
