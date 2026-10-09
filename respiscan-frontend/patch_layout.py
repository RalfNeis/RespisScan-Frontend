import re

with open('src/app/components/Layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken Unsplash images with ui-avatars
old_img = """                <img 
                  src={user.role === 'admin' 
                    ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3ODE3OTQzMjB8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                    : "https://images.unsplash.com/photo-1594824406567-b50e326c07a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXJzZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MTc5NDMyMHww&ixlib=rb-4.1.0&q=80&w=1080"}
                  alt={displayName} 
                  className="h-full w-full object-cover" 
                />"""

new_img = """                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=64`}
                  alt={displayName} 
                  className="h-full w-full object-cover" 
                />"""

content = content.replace(old_img, new_img)

with open('src/app/components/Layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
