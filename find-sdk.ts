import * as fs from 'fs';
import * as path from 'path';

console.log('--- DIRECTORIES IN ROOT (/) ---');
try {
  const rootFiles = fs.readdirSync('/');
  rootFiles.forEach(f => {
    try {
      const stats = fs.statSync('/' + f);
      if (stats.isDirectory() && f !== 'proc' && f !== 'sys' && f !== 'dev') {
        console.log(`Directory: /${f}`);
        // Read children
        const children = fs.readdirSync('/' + f);
        console.log(`  Children of /${f}: ${children.slice(0, 10).join(', ')}`);
      }
    } catch(e) {}
  });
} catch(e) {}
