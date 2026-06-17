import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'build.log');

async function main() {
  console.log("Initiating background Android build...");
  
  // Truncate or create build.log
  fs.writeFileSync(LOG_FILE, `=== BUILD LOG STARTED AT ${new Date().toISOString()} ===\n`);

  const out = fs.openSync(LOG_FILE, 'a');
  const err = fs.openSync(LOG_FILE, 'a');

  const child = spawn('npx', ['tsx', 'build-real-apk.ts'], {
    detached: true,
    stdio: ['ignore', out, err]
  });

  child.unref();

  console.log("Background build process successfully detached!");
  console.log(`Logs are being written to: ${LOG_FILE}`);
  console.log(`Process PID: ${child.pid}`);
}

main().catch(err => {
  console.error("Failed to spawn background build:", err);
  process.exit(1);
});
