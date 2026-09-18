import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Activity, Users, FileText, BarChart2, LogOut, HeartPulse, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', to: '/', icon: Activity, roles: ['admin', 'employee'] },
  { name: 'Patient Records', to: '/patients', icon: Users, roles: ['admin', 'employee'] },
  { name: 'Diagnose CXR', to: '/diagnosis', icon: HeartPulse, roles: ['admin', 'employee'] },
  { name: 'Analytics & Reports', to: '/reports', icon: BarChart2, roles: ['admin', 'employee'] },
  { name: 'Employee Data', to: '/employees', icon: FileText, roles: ['admin'] },
];

export function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <HeartPulse className="h-6 w-6 text-teal-500" />
            Respiscan
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-600/10 text-teal-400'
                    : 'hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-700 overflow-hidden">
              <img 
                src={user.role === 'admin' 
                  ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3ODE3OTQzMjB8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                  : "https://images.unsplash.com/photo-1594824406567-b50e326c07a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXJzZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MTc5NDMyMHww&ixlib=rb-4.1.0&q=80&w=1080"} 
                alt={user.name} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <h1 className="text-lg font-semibold text-slate-900">Clinical Portal</h1>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600" onClick={() => navigate('/settings')}>
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
