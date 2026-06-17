import * as fs from 'fs';
import * as path from 'path';

console.log('--- SCANNING FILESYSTEM FOR ANDROID SDK ---');

const pathsToCheck = [
  '/usr/lib/android-sdk',
  '/usr/local/share/android-sdk',
  '/opt/android-sdk',
  '/opt/android',
  '/root/Android/Sdk',
  '/root/android-sdk',
  '/home/build/android-sdk',
  '/usr/local/android-sdk',
  '/var/lib/android-sdk'
];

pathsToCheck.forEach(p => {
  if (fs.existsSync(p)) {
    console.log(`FOUND PATH: ${p}`);
    try {
      if (fs.statSync(p).isDirectory()) {
        const contents = fs.readdirSync(p);
        console.log(`  Contents of ${p}:`, contents.slice(0, 10)); // print first 10 items
      } else {
        console.log(`  It is a file!`);
      }
    } catch (e: any) {
      console.log(`  Error listing ${p}: ${e.message}`);
    }
  } else {
    console.log(`Path does not exist: ${p}`);
  }
});

// Let's also check environment variables for "ANDROID" or "SDK"
console.log('Env variables matching ANDROID or SDK:');
Object.keys(process.env).forEach(k => {
  if (k.includes('ANDROID') || k.includes('SDK') || k.includes('JVM') || k.includes('JAVA')) {
    console.log(`${k}: ${process.env[k]}`);
  }
});
