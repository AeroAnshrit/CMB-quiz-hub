#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'yearWise');

function walkDir(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkDir(full, filelist);
    else if (stat.isFile() && full.endsWith('.json')) filelist.push(full);
  }
  return filelist;
}

function normalizeChapter(name) {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function validateFile(filePath, chaptersMap, errors) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    errors.push({file: filePath, msg: `Could not read file: ${e.message}`});
    return;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    errors.push({file: filePath, msg: `Invalid JSON: ${e.message}`});
    return;
  }

  if (!json || typeof json !== 'object') {
    errors.push({file: filePath, msg: 'Top-level JSON must be an object.'});
    return;
  }

  if (!json.title || typeof json.title !== 'string') {
    errors.push({file: filePath, msg: 'Missing or invalid "title" field.'});
  }

  if (!Array.isArray(json.questions)) {
    errors.push({file: filePath, msg: 'Missing or invalid "questions" array.'});
    return;
  }

  json.questions.forEach((q, idx) => {
    const ctx = `${filePath} [question ${idx + 1}]`;
    if (!q || typeof q !== 'object') {
      errors.push({file: filePath, msg: `${ctx} — question must be an object.`});
      return;
    }
    // required fields
    const required = ['chapter', 'question', 'options', 'answer', 'explanation'];
    for (const key of required) {
      if (!(key in q)) {
        errors.push({file: filePath, msg: `${ctx} — missing required field '${key}'.`});
      }
    }
    // options must be an array of at least 2
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push({file: filePath, msg: `${ctx} — 'options' must be an array with at least 2 items.`});
    }
    // answer should be one of the options (string)
    if (typeof q.answer !== 'string') {
      errors.push({file: filePath, msg: `${ctx} — 'answer' should be a string.`});
    } else if (Array.isArray(q.options) && !q.options.includes(q.answer)) {
      errors.push({file: filePath, msg: `${ctx} — 'answer' is not one of the options.`});
    }

    // collect chapters
    const rawChapter = q.chapter || '__MISSING__';
    const norm = normalizeChapter(rawChapter);
    if (!chaptersMap[norm]) chaptersMap[norm] = new Set();
    chaptersMap[norm].add(rawChapter);
  });
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    process.exit(2);
  }

  const files = walkDir(DATA_DIR);
  if (files.length === 0) {
    console.log('No JSON files found under data/yearWise.');
    process.exit(0);
  }

  const errors = [];
  const chaptersMap = {};

  files.forEach(f => validateFile(f, chaptersMap, errors));

  console.log('Validation report');
  console.log('=================');
  console.log(`Files scanned: ${files.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((e, i) => {
      console.log(`${i + 1}. ${e.file || '<unknown file>'} — ${e.msg}`);
    });
  } else {
    console.log('\nNo structural errors found.');
  }

  // analyze chapter name variants
  const variants = Object.keys(chaptersMap).map(norm => ({norm, variants: Array.from(chaptersMap[norm])}));
  const inconsistent = variants.filter(v => v.variants.length > 1 || (v.variants.length === 1 && v.variants[0].trim() === '__MISSING__'));

  if (inconsistent.length > 0) {
    console.log('\nChapter name consistency warnings:');
    inconsistent.forEach(v => {
      console.log(`\n- Normalized: '${v.norm}'\n  Variants: ${v.variants.map(x => `'${x}'`).join(', ')}`);
    });
    console.log('\nRecommendation: choose a canonical chapter name for each normalized entry and update JSON files to use it (e.g., capitalize words consistently).');
  } else {
    console.log('\nAll chapter names look consistent.');
  }

  // exit with non-zero if any structural errors found
  if (errors.length > 0) process.exit(1);
}

if (require.main === module) main();
