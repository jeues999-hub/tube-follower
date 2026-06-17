import * as fs from 'fs';
import * as path from 'path';

console.log('--- VERIFYING APK PRESENCE ---');

const paths = [
  '.build-outputs/app-debug.apk',
  'APK_DOWNLOAD/app-debug.apk',
  'android/app/build/outputs/apk/debug/app-debug.apk'
];

paths.forEach(p => {
  const abs = path.resolve(p);
  if (fs.existsSync(abs)) {
    const s = fs.statSync(abs);
    console.log(`FOUND File: ${p} - size is ${(s.size / 1024 / 1024).toFixed(2)} MB (${s.size} bytes)`);
  } else {
    console.log(`NOT found: ${p}`);
  }
});

const androidPath = path.resolve('android');
if (fs.existsSync(androidPath)) {
  console.log('Android folder is present');
}
