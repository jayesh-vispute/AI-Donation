import os
import glob

replacements = {
    "'repeat(4, 1fr)'": "'repeat(auto-fit, minmax(240px, 1fr))'",
    "'repeat(5, 1fr)'": "'repeat(auto-fit, minmax(200px, 1fr))'",
    "'repeat(3, 1fr)'": "'repeat(auto-fit, minmax(300px, 1fr))'",
    "'1fr 1fr'": "'repeat(auto-fit, minmax(300px, 1fr))'",
    "'1fr 1fr 1fr'": "'repeat(auto-fit, minmax(300px, 1fr))'",
    "'1.2fr 1fr'": "'repeat(auto-fit, minmax(320px, 1fr))'",
    "'1fr 350px'": "'repeat(auto-fit, minmax(320px, 1fr))'",
    "'1fr 340px'": "'repeat(auto-fit, minmax(320px, 1fr))'",
    "'2fr 1fr'": "'repeat(auto-fit, minmax(320px, 1fr))'",
    "'2fr 1.1fr 0.9fr'": "'repeat(auto-fit, minmax(300px, 1fr))'",
    "'1.55fr 1fr'": "'repeat(auto-fit, minmax(320px, 1fr))'",
    "'1.2fr 0.9fr 0.9fr'": "'repeat(auto-fit, minmax(300px, 1fr))'",
    "'1fr 410px'": "'repeat(auto-fit, minmax(350px, 1fr))'",
    "'320px 1fr'": "'repeat(auto-fit, minmax(300px, 1fr))'",
}

for root, _, files in os.walk('frontend/src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
