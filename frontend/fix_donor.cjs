const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');
const targets = ['hi', 'te', 'kn', 'ta'];

let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to convert camelCase to Title Case
function camelToTitle(camelCase) {
    const result = camelCase.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// 1. Fix en.json donor block
for (const key in enData.donor) {
    if (typeof enData.donor[key] === 'string' && enData.donor[key].startsWith('donor.')) {
        const subKey = enData.donor[key].split('.')[1];
        if (subKey) {
            enData.donor[key] = camelToTitle(subKey);
        }
    }
}
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
console.log('Fixed en.json');

async function run() {
    const keys = Object.keys(enData.donor);
    
    for (const lang of targets) {
        console.log(`Processing donor block for ${lang}...`);
        const targetPath = path.join(localesDir, `${lang}.json`);
        let targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        
        targetData.donor = targetData.donor || {};
        
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
            const batchKeys = keys.slice(i, i + batchSize);
            const batchValues = batchKeys.map(k => enData.donor[k]);
            
            // Only translate real strings, not placeholders or purely numbers
            const toTranslate = batchValues.map(v => 
                (typeof v === 'string' && v.trim() !== '' && !v.match(/^\{\{[^}]+\}\}$/) && !v.match(/^[0-9]+$/)) 
                ? v : null
            );
            
            try {
                // translate ignores nulls/empty, but for mapping we just translate all strings and map back
                const res = await translate(batchValues, { to: lang, forceBatch: false });
                const responses = Array.isArray(res) ? res : [res];
                
                for (let j = 0; j < batchKeys.length; j++) {
                    if (toTranslate[j]) {
                        targetData.donor[batchKeys[j]] = responses[j].text;
                    } else {
                        targetData.donor[batchKeys[j]] = batchValues[j];
                    }
                }
            } catch (err) {
                console.error(`Error translating batch for ${lang}:`, err.message);
                // Fallback to english on error
                for (let j = 0; j < batchKeys.length; j++) {
                    targetData.donor[batchKeys[j]] = batchValues[j];
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2), 'utf8');
        console.log(`Saved ${lang}.json`);
    }
}

run().catch(console.error);
