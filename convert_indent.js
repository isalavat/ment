const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'services', 'bookingService.ts');

let content = fs.readFileSync(filePath, 'utf-8');

// Convert each group of 2 leading spaces to a tab
const lines = content.split('\n');
const convertedLines = lines.map(line => {
  const match = line.match(/^( *)/);
  if (match) {
    const spaces = match[1];
    const numSpaces = spaces.length;
    const tabs = '\t'.repeat(Math.floor(numSpaces / 2));
    const remainder = ' '.repeat(numSpaces % 2);
    return tabs + remainder + line.substring(numSpaces);
  }
  return line;
});

const convertedContent = convertedLines.join('\n');

fs.writeFileSync(filePath, convertedContent, 'utf-8');

console.log('Conversion complete');
