#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function walk(dir, list=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, list);
    else if (e.isFile() && full.endsWith('.js')) list.push(full);
  }
  return list;
}

const root = path.resolve(__dirname, '..');
const files = walk(root).filter(p => p.indexOf('node_modules') === -1 && p.indexOf('public/css') === -1);
let errors = [];
for (const f of files) {
  try {
    const code = fs.readFileSync(f, 'utf8');
    // Try to compile the code without running it
    new vm.Script(code, { filename: f });
  } catch (e) {
    errors.push({file:f, msg: e && e.message});
  }
}

console.log('JS syntax check report');
console.log('=======================');
console.log(`Files scanned: ${files.length}`);
if (errors.length===0) console.log('No JS syntax errors found.');
else {
  console.log(`Errors (${errors.length}):`);
  errors.forEach((er,i)=> console.log(`${i+1}. ${er.file} — ${er.msg}`));
  process.exitCode = 2;
}
