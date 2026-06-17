import * as fs from 'fs';
import * as path from 'path';

const jarPath = path.resolve('android', 'gradle', 'wrapper', 'gradle-wrapper.jar');
if (fs.existsSync(jarPath)) {
  const stat = fs.statSync(jarPath);
  console.log(`File size of gradle-wrapper.jar: ${stat.size} bytes`);
  
  const fd = fs.openSync(jarPath, 'r');
  const buffer = Buffer.alloc(Math.min(stat.size, 200));
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  console.log('First 200 characters of gradle-wrapper.jar:');
  console.log(buffer.toString('utf-8'));
  fs.closeSync(fd);
} else {
  console.log('gradle-wrapper.jar does not exist!');
}
