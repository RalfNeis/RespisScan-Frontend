import re

with open('src/app/pages/DoctorProfile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific avatarUrl line using regex
pattern = r"const avatarUrl = \\https.*?;"
replacement = "const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff&size=256`;"

content = re.sub(pattern, replacement, content)

with open('src/app/pages/DoctorProfile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
