const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, '..', 'public', 'fonts', 'DejaVuSans.ttf');
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'fontBase64.ts');

const fontData = fs.readFileSync(fontPath);
const base64 = fontData.toString('base64');

fs.writeFileSync(outputPath, `// Auto-generated file - DO NOT EDIT\nconst fontBase64 = "${base64}";\nexport default fontBase64;\n`);

console.log('Font base64 generated successfully');
console.log('Font size:', fontData.length, 'bytes');
console.log('Base64 length:', base64.length);