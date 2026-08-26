import os
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    original = content
    
    # 1. Replace SIKAP -> S-KEU
    content = content.replace("SIKAP", "S-KEU")
    # 2. Replace Sikap -> S-Keu
    content = content.replace("Sikap", "S-Keu")
    # 3. Replace sikap_ -> s-keu_ (like in sikap_read_notifs)
    content = content.replace("sikap_", "s-keu_")
    
    # Check if anything changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

if __name__ == '__main__':
    exclude_dirs = ['node_modules', '.git', 'build', '.dart_tool', 'android/app/build']
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.gradle')]
        
        for file in files:
            if file.endswith(('.dart', '.jsx', '.js', '.json', '.html', '.md', '.yaml', '.xml', '.kt', '.kts')):
                process_file(os.path.join(root, file))

print("Done!")
