import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, Mail, Building, Briefcase, Award, FileText, Activity } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch profile details
    api.get(`/auth/employees/${id}/`)
      .then((res: any) => {
        setProfile(res);
        // Also fetch their recent scans if available
        // We'll query scans where uploaded_by = id if the backend supports it, 
        // else we can just show a dummy or leave empty.
        // The backend ScanListView doesn't have an explicit uploaded_by filter yet, 
        // but we can try fetching all and filtering, or just omit if it's too complex.
        // For now, let's just mock some activity or omit if not found.
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Profile not found.</div>;
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  
  let displayName = fullName;
  let isDr = false;
  if (profile.title && profile.title.toLowerCase().includes('dr')) {
    isDr = true;
    if (!fullName.toLowerCase().startsWith('dr')) {
      displayName = `Dr. ${fullName}`;
    }
  }

  const roleTitle = profile.role === 'admin' ? 'Chief Radiologist / Admin' : 'Diagnostic Radiologist';
  const displaySubtitle = (profile.title && !isDr) ? profile.title : roleTitle;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff&size=256`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* Main Profile Card (LinkedIn Style) */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-600 via-slate-900 to-slate-900"></div>
          {/* Subtle pattern or graphic could go here */}
        </div>

        <CardContent className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-24 mb-6">
            {/* Avatar */}
            <div className="relative inline-block z-10">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
              </div>
              <div className="absolute bottom-2 right-2 h-6 w-6 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm" title="Active Account">
                <Activity className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 z-10 sm:mb-4">
              {isOwnProfile ? (
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  Edit Profile
                </Button>
              ) : (
                <Button variant="outline">
                  View Records
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                {profile.role.toUpperCase()}
              </span>
            </div>
            <p className="text-lg text-slate-600 mt-1">
              {displaySubtitle}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
              {profile.department && (
                <div className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" /> {profile.department}
                </div>
              )}
              {profile.license_number && (
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> License: {profile.license_number}
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {profile.email}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: About & Experience */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" /> About
              </h2>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No biography provided by this user. They are a valued member of the clinical team at RespiScan."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-400" /> Clinical Role
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Activity className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{displaySubtitle}</h3>
                    <p className="text-sm text-slate-500">RespiScan Clinical Portal • Full-time</p>
                    <p className="text-sm text-slate-500 mt-1">Responsible for reviewing AI-assisted diagnostic reports, verifying DenseNet-121 Grad-CAM heatmaps, and finalizing patient records for bacterial pneumonia screenings.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & System Info */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">System Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-3 border-b border-slate-200">
                  <span className="text-slate-500">Account ID</span>
                  <span className="font-medium text-slate-900">{profile.username}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-slate-200">
                  <span className="text-slate-500">Privilege Level</span>
                  <span className="font-medium text-slate-900 capitalize">{profile.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium text-slate-900">
                    {profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
