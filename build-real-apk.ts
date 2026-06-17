import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Target Paths
const PORTABLE_JDK_DIR = '/tmp/portable-jdk';
const PORTABLE_SDK_DIR = '/tmp/portable-sdk';
const ANDROID_DIR = path.join(process.cwd(), 'android');
const BUILD_OUTPUT_DIR = path.join(process.cwd(), '.build-outputs');
const APK_DOWNLOAD_DIR = path.join(process.cwd(), 'APK_DOWNLOAD');

// URLs
const JDK_URL = 'https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse';
const SDK_URL = 'https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip';

function speak(msg: string) {
  console.log(`[BUILD TRIGGER] ${msg}`);
}

function runCmd(cmd: string, cwd = '/') {
  speak(`Executing: ${cmd}`);
  try {
    const out = execSync(cmd, { 
      cwd, 
      encoding: 'utf8',
      env: {
        ...process.env,
        JAVA_HOME: PORTABLE_JDK_DIR,
        ANDROID_HOME: PORTABLE_SDK_DIR,
        PATH: `${PORTABLE_JDK_DIR}/bin:${process.env.PATH}`
      }
    });
    console.log(out);
  } catch (err: any) {
    console.error(`Command failed: ${cmd}\nError: ${err.message}\nOutput: ${err.stdout || ''}\nStderr: ${err.stderr || ''}`);
    throw err;
  }
}

async function start() {
  const startTime = Date.now();
  speak("Starting JDK & Android SDK setup...");

  // 1. Create temporary workspace directories
  if (!fs.existsSync(PORTABLE_JDK_DIR)) {
    fs.mkdirSync(PORTABLE_JDK_DIR, { recursive: true });
  }
  if (!fs.existsSync(PORTABLE_SDK_DIR)) {
    fs.mkdirSync(PORTABLE_SDK_DIR, { recursive: true });
  }

  // 2. Setup Portable Java JDK
  if (!fs.existsSync(path.join(PORTABLE_JDK_DIR, 'bin', 'java'))) {
    speak("Downloading portable JDK 17...");
    runCmd(`wget -qO /tmp/jdk.tar.gz "${JDK_URL}"`);
    speak("Extracting JDK...");
    runCmd(`tar -xzf /tmp/jdk.tar.gz -C ${PORTABLE_JDK_DIR} --strip-components=1`);
    runCmd(`rm -f /tmp/jdk.tar.gz`);
    speak("JDK installed successfully!");
  } else {
    speak("Portable JDK already exists.");
  }

  // Double check Java
  runCmd('java -version');

  // 3. Setup Portable Android SDK Command Line Tools
  const sdkManagerPath = path.join(PORTABLE_SDK_DIR, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
  if (!fs.existsSync(sdkManagerPath)) {
    speak("Downloading Android SDK Command Line Tools...");
    runCmd(`wget -qO /tmp/cmdline.zip "${SDK_URL}"`);
    
    speak("Extracting Command Line Tools zip...");
    const destCmdline = path.join(PORTABLE_SDK_DIR, 'cmdline-tools');
    if (!fs.existsSync(destCmdline)) {
      fs.mkdirSync(destCmdline, { recursive: true });
    }
    runCmd(`unzip -q /tmp/cmdline.zip -d ${destCmdline}`);
    runCmd(`rm -f /tmp/cmdline.zip`);

    speak("Rearranging cmdlinetools folder to Match latest spec...");
    const nestedFolder = path.join(destCmdline, 'cmdline-tools');
    const latestFolder = path.join(destCmdline, 'latest');
    if (fs.existsSync(nestedFolder)) {
      fs.renameSync(nestedFolder, latestFolder);
    }
    speak("Command Line Tools configured!");
  } else {
    speak("Command Line Tools already exist.");
  }

  // 4. Install Platforms and Build-Tools components
  const platformPath = path.join(PORTABLE_SDK_DIR, 'platforms', 'android-34');
  if (!fs.existsSync(platformPath)) {
    speak("Installing Android 34 platforms & build-tools v34.0.0...");
    runCmd(`yes | ${sdkManagerPath} --sdk_root=${PORTABLE_SDK_DIR} "platforms;android-34" "build-tools;34.0.0"`);
    speak("SDK components installed!");
  } else {
    speak("SDK components already exist.");
  }

  // 5. Build local.properties inside Cordova/Capacitor Android root
  speak("Writing local.properties for the native project...");
  const localPropsPath = path.join(ANDROID_DIR, 'local.properties');
  fs.writeFileSync(localPropsPath, `sdk.dir=${PORTABLE_SDK_DIR}\n`);

  // 5.5 Download a clean gradle-wrapper.jar to prevent binary corruption errors
  speak("Ensuring clean, uncorrupted gradle-wrapper.jar is present...");
  try {
    const jarDest = path.join(ANDROID_DIR, 'gradle', 'wrapper', 'gradle-wrapper.jar');
    runCmd(`wget -qO ${jarDest} "https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar"`, process.cwd());
    speak("Clean gradle-wrapper.jar configured successfully!");
  } catch (jarErr: any) {
    speak(`Warning: could not re-download gradle-wrapper.jar: ${jarErr.message}. Attempting compile anyway.`);
  }

  // 6. Run Gradle to compile real Debug APK!
  speak("Compiling Android Native Debug APK with memory limits...");
  runCmd('chmod +x gradlew', ANDROID_DIR);
  runCmd('./gradlew --no-daemon -Dorg.gradle.jvmargs="-Xmx1536m -XX:MaxMetaspaceSize=512m" assembleDebug', ANDROID_DIR);

  // 7. Extract real generated APK
  const generatedApk = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(generatedApk)) {
    throw new Error(`Gradle build completed, but failed to find APK output at: ${generatedApk}`);
  }

  // Copy APK to required directories
  if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
    fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(APK_DOWNLOAD_DIR)) {
    fs.mkdirSync(APK_DOWNLOAD_DIR, { recursive: true });
  }

  const targetApk1 = path.join(BUILD_OUTPUT_DIR, 'app-debug.apk');
  const targetApk2 = path.join(APK_DOWNLOAD_DIR, 'app-debug.apk');

  fs.copyFileSync(generatedApk, targetApk1);
  fs.copyFileSync(generatedApk, targetApk2);

  const stats = fs.statSync(targetApk1);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  speak("================================================");
  speak("DEBUG APK BUILD SUCCESSFUL!");
  speak(`Saved Location 1: ${targetApk1}`);
  speak(`Saved Location 2: ${targetApk2}`);
  speak(`Real APK Size: ${sizeMb} MB`);
  
  // Run zip creation automatically
  speak("Creating ZIP file of the project including the APK...");
  try {
    runCmd('npx tsx create-zip.ts', process.cwd());
    speak("ZIP file created successfully in public directory!");
  } catch (archiveErr: any) {
    speak(`Failed to create ZIP in background build: ${archiveErr.message}`);
  }

  // Clean up any lingering Gradle daemons to free up system memory
  try {
    speak("Stopping any lingering Gradle daemon processes...");
    runCmd('./gradlew --stop', ANDROID_DIR);
  } catch (stopErr: any) {
    // Ignore error
  }

  speak(`Total Elapsed Time: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
  speak("================================================");
}

start().catch(err => {
  console.error("FATAL BUILD ERROR:", err);
  process.exit(1);
});
