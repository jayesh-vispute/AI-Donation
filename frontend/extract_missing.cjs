const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const localesDir = path.join(srcDir, 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');

let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, filesList);
        } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
            filesList.push(filePath);
        }
    }
    return filesList;
}

const files = getFiles(srcDir);
let addedKeys = 0;

function camelToTitle(camelCase) {
    const result = camelCase.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Regex to match t('namespace.key') or t("namespace.key") without second argument
// We use a negative lookahead to ensure there's no comma inside the parens
const regex = /t\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        const fullPath = match[1];
        
        const parts = fullPath.split('.');
        if (parts.length < 2) continue;
        
        const namespace = parts[0];
        const keyParts = parts.slice(1);
        
        enData[namespace] = enData[namespace] || {};
        
        let current = enData[namespace];
        for (let i = 0; i < keyParts.length - 1; i++) {
            current[keyParts[i]] = current[keyParts[i]] || {};
            current = current[keyParts[i]];
        }
        
        const lastKey = keyParts[keyParts.length - 1];
        if (current[lastKey] === undefined || (typeof current[lastKey] === 'string' && current[lastKey].startsWith(namespace + '.'))) {
            const defaultValue = camelToTitle(lastKey);
            current[lastKey] = defaultValue;
            addedKeys++;
            console.log(`Added missing single-arg key: ${fullPath} = "${defaultValue}"`);
        }
    }
}

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
console.log(`Finished. Added ${addedKeys} single-arg keys to en.json.`);
