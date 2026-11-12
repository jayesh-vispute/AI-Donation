const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');
const targets = ['hi', 'te', 'kn', 'ta'];

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to flatten object to a map of path -> value
function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

// Helper to unflatten map back to object
function unflatten(flatObj) {
  const result = {};
  for (const key in flatObj) {
    const keys = key.split('.');
    keys.reduce((acc, current, index) => {
      if (index === keys.length - 1) {
        acc[current] = flatObj[key];
      } else {
        acc[current] = acc[current] || {};
      }
      return acc[current];
    }, result);
  }
  return result;
}

async function run() {
  const enFlat = flatten(enData);
  
  for (const lang of targets) {
    console.log(`Processing ${lang}...`);
    const targetPath = path.join(localesDir, `${lang}.json`);
    let targetData = {};
    if (fs.existsSync(targetPath)) {
      targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    }
    const targetFlat = flatten(targetData);
    
    const keysToTranslate = [];
    const valuesToTranslate = [];
    
    for (const key in enFlat) {
      const enVal = enFlat[key];
      const targetVal = targetFlat[key];
      
      // If it's missing or exactly the same as English, translate it.
      // We skip translation if the English string is just a placeholder like "{{count}}" or short codes.
      if (!targetVal || targetVal === enVal) {
          // ignore purely interpolated strings or purely numbers
          if (typeof enVal === 'string' && enVal.trim() !== '' && !enVal.match(/^\{\{[^}]+\}\}$/) && !enVal.match(/^[0-9]+$/)) {
              keysToTranslate.push(key);
              valuesToTranslate.push(enVal);
          } else {
              targetFlat[key] = enVal; // Just copy it
          }
      }
    }
    
    console.log(`Found ${keysToTranslate.length} strings to translate for ${lang}.`);
    
    // Batch translation to avoid limits
    const batchSize = 100;
    for (let i = 0; i < valuesToTranslate.length; i += batchSize) {
      const batchKeys = keysToTranslate.slice(i, i + batchSize);
      const batchValues = valuesToTranslate.slice(i, i + batchSize);
      
      console.log(`Translating batch ${i} to ${i + batchValues.length} out of ${valuesToTranslate.length} for ${lang}...`);
      try {
        const res = await translate(batchValues, { to: lang, forceBatch: false });
        // Handle array or single response
        const responses = Array.isArray(res) ? res : [res];
        
        for (let j = 0; j < batchKeys.length; j++) {
            // preserve interpolations ideally, but for now just use the translated text
            targetFlat[batchKeys[j]] = responses[j].text;
        }
      } catch (err) {
        console.error(`Error translating batch for ${lang}:`, err.message);
      }
      
      // small delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Reconstruct and save
    const newTargetData = unflatten(targetFlat);
    fs.writeFileSync(targetPath, JSON.stringify(newTargetData, null, 2), 'utf8');
    console.log(`Saved ${lang}.json`);
  }
}

run().catch(console.error);
