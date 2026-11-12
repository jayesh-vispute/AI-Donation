const fs = require('fs');
const path = require('path');

const replacements = {
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
    "'320px 1fr'": "'repeat(auto-fit, minmax(300px, 1fr))'"
};

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('frontend/src/pages');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    for (const [oldStr, newStr] of Object.entries(replacements)) {
        newContent = newContent.split(oldStr).join(newStr);
    }
    
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
