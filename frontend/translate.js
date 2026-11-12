const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const LOCALES_DIR = path.join(SRC_DIR, 'i18n', 'locales');

const langs = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' }
];

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const extractedKeys = {}; 

function extractTranslations() {
  const files = getFiles(SRC_DIR);
  // Match t('key', 'default') or t("key", "default")
  const regex = /t\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]((?:[^'"\\]|\\.)*)['"]|\s*,\s*\{.*?\}\s*)?\)/g;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      const defaultValue = match[2];
      
      if (!extractedKeys[key]) {
        let textToTranslate = defaultValue;
        if (!textToTranslate) {
          const parts = key.split('.');
          textToTranslate = parts[parts.length - 1];
        }
        textToTranslate = textToTranslate.replace(/\\'/g, "'").replace(/\\"/g, '"');
        extractedKeys[key] = textToTranslate;
      }
    }
  }
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    if (!current) return undefined;
    current = current[keys[i]];
  }
  return current;
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  
  await delay(300); // Rate limit
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data[0].map(x => x[0]).join('');
  } catch (e) {
    console.error(`Failed to translate: ${text} to ${targetLang}`, e.message);
    return text;
  }
}

async function main() {
  console.log('Extracting translations...');
  extractTranslations();
  console.log(`Found ${Object.keys(extractedKeys).length} keys.`);

  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  for (const lang of langs) {
    console.log(`\nProcessing language: ${lang.name} (${lang.code})`);
    const filePath = path.join(LOCALES_DIR, `${lang.code}.json`);
    let localeData = {};
    if (fs.existsSync(filePath)) {
      try {
        localeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        localeData = {};
      }
    }

    let updatedCount = 0;

    for (const [key, defaultValue] of Object.entries(extractedKeys)) {
      const existing = getNestedValue(localeData, key);
      if (!existing) {
        if (lang.code === 'en') {
          setNestedValue(localeData, key, defaultValue);
          updatedCount++;
        } else {
          const translated = await translateText(defaultValue, lang.code);
          setNestedValue(localeData, key, translated);
          updatedCount++;
          console.log(`[${lang.code}] Translated: "${defaultValue}" -> "${translated}"`);
        }
      }
    }
    
    fs.writeFileSync(filePath, JSON.stringify(localeData, null, 2), 'utf-8');
    console.log(`Updated ${lang.name} with ${updatedCount} new keys.`);
  }
  
  console.log('\nAll done!');
}

main().catch(console.error);
