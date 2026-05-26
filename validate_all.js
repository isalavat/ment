#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = path.join(__dirname, 'backend', 'src', 'services', 'bookingService.ts');

// Read file
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 1) Count lines matching ^ {2,}\S (leading spaces with 2 or more)
const count1 = lines.filter(line => /^ {2,}\S/.test(line)).length;

// 2) Count lines matching ^\t+\S (leading tabs)
const count2 = lines.filter(line => /^\t+\S/.test(line)).length;

// 3) First 30 lines
const first30 = lines.slice(0, 30).join('\n');

// 4) Snippet around async updateMeetingLink
let updateMeetingLinkSnippet = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async updateMeetingLink')) {
    const start = Math.max(0, i - 2);
    const end = Math.min(lines.length, i + 15);
    updateMeetingLinkSnippet = lines.slice(start, end).join('\n');
    break;
  }
}

// 5) Git status
let gitStatus = '';
try {
  gitStatus = execSync('git --no-pager status --short', {
    cwd: __dirname,
    encoding: 'utf-8'
  });
} catch (e) {
  gitStatus = 'Git error: ' + e.message;
}

console.log('='.repeat(70));
console.log('VALIDATION RESULTS');
console.log('='.repeat(70));
console.log(`\n1) Lines matching "^ {2,}\\S" (2+ leading spaces): ${count1}`);
console.log(`\n2) Lines matching "^\\t+\\S" (leading tabs): ${count2}`);
console.log(`\n3) First 30 lines:`);
console.log('-'.repeat(70));
console.log(first30);
console.log('-'.repeat(70));
console.log(`\n4) Snippet around 'async updateMeetingLink':`);
console.log('-'.repeat(70));
console.log(updateMeetingLinkSnippet);
console.log('-'.repeat(70));
console.log(`\n5) Git status (--short):`);
console.log('-'.repeat(70));
console.log(gitStatus || '(no changes)');
console.log('-'.repeat(70));
