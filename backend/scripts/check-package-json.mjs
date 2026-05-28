import fs from 'fs';
import path from 'path';

const p = path.resolve(process.cwd(), 'package.json');
console.log('Checking file:', p);
try {
  const buf = fs.readFileSync(p);
  console.log('Size (bytes):', buf.length);
  const hasNull = buf.includes(0);
  console.log('Contains null (0x00) bytes:', hasNull);
  const startHex = Array.from(buf.slice(0, 40)).map(b => b.toString(16).padStart(2,'0')).join(' ');
  console.log('First 40 bytes (hex):', startHex);
  // try decode as utf8
  try {
    const s = buf.toString('utf8');
    console.log('\nPreview (first 600 chars):\n');
    console.log(s.slice(0, 600));
    try {
      JSON.parse(s);
      console.log('\nJSON.parse succeeded (utf8)');
    } catch (e) {
      console.error('\nJSON.parse failed (utf8):', e.message);
    }
  } catch (e) {
    console.error('Decoding as utf8 failed:', e.message);
  }
  // try decode as utf16le if null bytes present
  if (hasNull) {
    try {
      const s16 = buf.toString('utf16le');
      console.log('\nDecoded as utf16le preview (first 600 chars):\n');
      console.log(s16.slice(0, 600));
      try {
        JSON.parse(s16);
        console.log('\nJSON.parse succeeded (utf16le)');
      } catch (e) {
        console.error('\nJSON.parse failed (utf16le):', e.message);
      }
    } catch (e) {
      console.error('Decoding as utf16le failed:', e.message);
    }
  }
} catch (err) {
  console.error('Error reading file:', err.message);
  process.exit(2);
}

console.log('\nDone.');
