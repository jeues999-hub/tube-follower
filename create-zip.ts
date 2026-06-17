import * as fs from 'fs';
import * as path from 'path';
import { ZipArchive } from 'archiver';

const ZIP_NAME = 'app-force-update.zip';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUTPUT_ZIP_PATH = path.join(PUBLIC_DIR, ZIP_NAME);

async function zipProject() {
  console.log('--- STARTING ZIP PROJECT ---');

  // Verify the APK is currently present in APK_DOWNLOAD
  const apkPath = path.join(process.cwd(), 'APK_DOWNLOAD', 'app-debug.apk');
  if (!fs.existsSync(apkPath)) {
    console.error(`Error: APK file not found at ${apkPath}. Please build the APK first.`);
    process.exit(1);
  }

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Create write stream for ZIP
  const output = fs.createWriteStream(OUTPUT_ZIP_PATH);
  const archive = new ZipArchive({
    zlib: { level: 9 } // Maximum compression level
  });

  output.on('close', () => {
    console.log(`--- ZIP COMPLETED SUCCESSFULLY ---`);
    console.log(`ZIP File: ${OUTPUT_ZIP_PATH}`);
    console.log(`ZIP Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB (${archive.pointer()} bytes)`);
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('Zip warning:', err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add individual files
  const filesToInclude = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'capacitor.config.json',
    'capacitor.config.ts',
    'firebase-blueprint.json',
    'firestore.rules',
    'firebase-applet-config.json',
    'metadata.json',
    'build-android-apk.ts',
    'build-real-apk.ts',
    'check-apk-exists.ts'
  ];

  filesToInclude.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
    }
  });

  // Add directories
  const dirsToInclude = ['src', 'public', 'android', 'APK_DOWNLOAD'];
  dirsToInclude.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      // For public directory, avoid adding the output zip itself to prevent infinite loop/corruption
      if (dir === 'public') {
        archive.directory(dirPath, 'public', (entry) => {
          if (entry.name.endsWith(ZIP_NAME)) {
            return false;
          }
          return entry;
        });
      } else {
        archive.directory(dirPath, dir);
      }
    }
  });

  await archive.finalize();
}

zipProject().catch(err => {
  console.error('Failed to create ZIP:', err);
  process.exit(1);
});
