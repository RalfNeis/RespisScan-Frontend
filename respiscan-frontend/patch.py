import re

with open('src/app/pages/DoctorProfile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace avatarUrl logic
old_avatar = """  const isOwnProfile = currentUser?.id === profile.id;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  
  // Choose avatar based on role"""

new_avatar = """  const isOwnProfile = currentUser?.id === profile.id;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  
  let displayName = fullName;
  let isDr = false;
  if (profile.title && profile.title.toLowerCase().includes('dr')) {
    isDr = true;
    if (!fullName.toLowerCase().startswith('dr')) {
      displayName = `Dr. ${fullName}`;
    }
  }

  const roleTitle = profile.role === 'admin' ? 'Chief Radiologist / Admin' : 'Diagnostic Radiologist';
  const displaySubtitle = (profile.title && !isDr) ? profile.title : roleTitle;
  
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff&size=256`;
"""

content = content.replace(old_avatar, new_avatar)

# Clean out the rest of the old avatar logic
content = re.sub(r'const avatarUrl =.*?return \(', 'return (', content, flags=re.DOTALL)

# 2. Replace the name / tag rendering
old_name_render = """          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-900">{fullName}</h1>
            <p className="text-lg text-slate-600 mt-1 flex items-center gap-2">
              {profile.title || (profile.role === 'admin' ? 'Chief Radiologist / Admin' : 'Diagnostic Radiologist')}
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                {profile.role.toUpperCase()}
              </span>
            </p>"""

new_name_render = """          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
            <p className="text-lg text-slate-600 mt-1 flex items-center gap-2">
              {displaySubtitle}
              {profile.role === 'admin' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                  ADMIN
                </span>
              )}
            </p>"""

content = content.replace(old_name_render, new_name_render)

# 3. Replace the clinical role rendering
old_clinical_render = """                  <div>
                    <h3 className="font-semibold text-slate-900">{profile.title || 'Radiologist'}</h3>"""

new_clinical_render = """                  <div>
                    <h3 className="font-semibold text-slate-900">{displaySubtitle}</h3>"""

content = content.replace(old_clinical_render, new_clinical_render)

with open('src/app/pages/DoctorProfile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
