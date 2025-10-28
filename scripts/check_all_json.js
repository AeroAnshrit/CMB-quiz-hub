#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir, list=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, list);
    else if (e.isFile() && full.endsWith('.json')) list.push(full);
  }
  return list;
}

const root = path.resolve(__dirname, '..');
const files = walk(root);
let errors = [];
for (const f of files) {
  try {
    const stat = fs.statSync(f);
    if (stat.size === 0) {
      errors.push({file:f, msg: 'Empty file'});
      continue;
    }
    const raw = fs.readFileSync(f, 'utf8');
    JSON.parse(raw);
  } catch (e) {
    errors.push({file:f, msg: e && e.message});
  }
}

console.log('JSON check report');
console.log('===================');
console.log(`Files scanned: ${files.length}`);
if (errors.length===0) console.log('No JSON errors found.');
else {
  console.log(`Errors (${errors.length}):`);
  errors.forEach((er,i)=> console.log(`${i+1}. ${er.file} — ${er.msg}`));
  process.exitCode = 2;
}
