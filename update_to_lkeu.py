import os

replacements = {
    "L-Keu": "L-Keu",
    "L-Keu": "L-Keu",
    "l-keu": "l-keu"
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root or "build" in root or ".dart_tool" in root or ".pub-cache" in root or "ios" in root or "macos" in root:
        continue
    for file in files:
        if file.endswith(('.js', '.jsx', '.json', '.html', '.dart', '.yaml', '.xml', '.py', '.kts', '.gradle', '.md')):
            replace_in_file(os.path.join(root, file))
