import os

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    original = content
    
    # 1. Fix invalid class names (Dart)
    content = content.replace("L-KeuApp", "SkeuApp")
    content = content.replace("L-KeuAppBar", "SkeuAppBar")
    
    # 2. Revert package names back to sikap_mobile so flutter builds
    # Since we promised not to change folder/package names.
    content = content.replace("l-keu_mobile", "sikap_mobile")
    
    # Also revert any com.l-keudarurrohman to com.sikapdarurrohman if it happened
    content = content.replace("com.l-keudarurrohman", "com.sikapdarurrohman")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")

if __name__ == '__main__':
    exclude_dirs = ['node_modules', '.git', 'build', '.dart_tool', 'android/app/build']
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.gradle')]
        for file in files:
            if file.endswith(('.dart', '.xml', '.kt', '.kts', '.yaml', '.md', '.json', '.jsx', '.html', '.iml')):
                fix_file(os.path.join(root, file))

print("Fix completed!")
