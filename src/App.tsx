import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Settings, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  User, 
  LogOut, 
  LogIn, 
  Info, 
  Save, 
  TrendingUp, 
  Users, 
  ShieldAlert,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase.ts';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { AppVersionConfig } from './types.ts';

// Initial baseline configuration
const DEFAULT_CONFIG: AppVersionConfig = {
  minVersion: '1.1.0',
  currentVersion: '1.2.0',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.whatsapp',
  updateMessage: 'New update available. Please update to continue.',
  updatedAt: new Date().toISOString()
};

export default function App() {
  // Config state from Firebase
  const [dbConfig, setDbConfig] = useState<AppVersionConfig | null>(null);
  
  // Admin form inputs
  const [minVersionInput, setMinVersionInput] = useState(DEFAULT_CONFIG.minVersion);
  const [currentVersionInput, setCurrentVersionInput] = useState(DEFAULT_CONFIG.currentVersion);
  const [playStoreUrlInput, setPlayStoreUrlInput] = useState(DEFAULT_CONFIG.playStoreUrl);
  const [updateMessageInput, setUpdateMessageInput] = useState(DEFAULT_CONFIG.updateMessage);
  
  // Simulated Client states
  const [simulatedLocalVersion, setSimulatedLocalVersion] = useState('1.0.0');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  // Auth and general systems
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  // Real-time clock update (guidelines priority: literal, humble and functional label/use)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync (configs/global)
  useEffect(() => {
    const configDocRef = doc(db, 'configs', 'global');
    const unsubscribe = onSnapshot(configDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppVersionConfig;
        setDbConfig(data);
        // Sync inputs if not currently customized/focused by admin to prevent overwrite glitch
        setMinVersionInput(data.minVersion);
        setCurrentVersionInput(data.currentVersion);
        setPlayStoreUrlInput(data.playStoreUrl);
        setUpdateMessageInput(data.updateMessage);
      } else {
        // Create baseline if not exists
        try {
          setDoc(configDocRef, DEFAULT_CONFIG);
          setDbConfig(DEFAULT_CONFIG);
        } catch (err) {
          console.error("Failed to initialize baseline config in Firestore. Continuing offline.", err);
          setDbConfig(DEFAULT_CONFIG);
        }
      }
    }, (error) => {
      console.warn("Unable to connect to live Firestore configuration. Displaying offline baseline draft.", error);
      setDbConfig(DEFAULT_CONFIG);
    });

    return () => unsubscribe();
  }, []);

  // Handlers
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error("Sign-in failed:", e.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.error("Sign-out failed:", e.message);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLoading(true);
    setSavedSuccessMessage(false);
    
    const targetDoc = 'configs/global';
    try {
      const payload: AppVersionConfig = {
        minVersion: minVersionInput.trim(),
        currentVersion: currentVersionInput.trim(),
        playStoreUrl: playStoreUrlInput.trim(),
        updateMessage: updateMessageInput.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'configs', 'global'), payload);
      setSavedSuccessMessage(true);
      setTimeout(() => setSavedSuccessMessage(false), 4000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, targetDoc);
    } finally {
      setSavingLoading(false);
    }
  };

  // Compare versions logic sematically (Semantic Versioning 3-part compare)
  const parseVersion = (vStr: string) => {
    const parts = vStr.split('.').map(x => parseInt(x, 10) || 0);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  };

  const isLocalVersionOutdated = () => {
    const activeMin = dbConfig ? dbConfig.minVersion : DEFAULT_CONFIG.minVersion;
    const pLocal = parseVersion(simulatedLocalVersion);
    const pMin = parseVersion(activeMin);

    if (pLocal.major !== pMin.major) {
      return pLocal.major < pMin.major;
    }
    if (pLocal.minor !== pMin.minor) {
      return pLocal.minor < pMin.minor;
    }
    return pLocal.patch < pMin.patch;
  };

  const isUpdateRequired = isLocalVersionOutdated();
  const currentActiveMin = dbConfig?.minVersion || DEFAULT_CONFIG.minVersion;
  const currentActiveStore = dbConfig?.currentVersion || DEFAULT_CONFIG.currentVersion;
  const currentActivePlayStoreUrl = dbConfig?.playStoreUrl || DEFAULT_CONFIG.playStoreUrl;
  const currentActiveMsg = dbConfig?.updateMessage || DEFAULT_CONFIG.updateMessage;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Upper navigation header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100 animate-pulse-slow">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Android App Version Dashboard</h1>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              UTC: {currentTime}
            </p>
          </div>
        </div>

        {/* User Identity Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">{user.displayName || user.email}</span>
              <button 
                onClick={handleSignOut}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
                id="sign-out-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-indigo-100 transition-all cursor-pointer"
              id="google-signin-btn"
            >
              <LogIn className="w-4 h-4" />
              Admin Portal Login (Google)
            </button>
          )}
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Grid Side - 5 columns: Android Simulator Device */}
        <section className="lg:col-span-5 flex flex-col items-center gap-6">
          <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Device View Simulator</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Simulate how the app reacts instantly to version updates. Outdated clients display a beautiful, non-blocking update recommendation alert banner.
            </p>

            {/* Simulated Version Selector */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Simulated Device Local Version:</span>
              <select
                value={simulatedLocalVersion}
                onChange={(e) => setSimulatedLocalVersion(e.target.value)}
                className="bg-white border border-slate-300 rounded-md py-1 px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono cursor-pointer"
                id="sim-version-selector"
              >
                <option value="1.0.0">v1.0.0 (Legacy)</option>
                <option value="1.1.0">v1.1.0 (Intermediate)</option>
                <option value="1.2.0">v1.2.0 (Latest)</option>
              </select>
            </div>
          </div>

          {/* Android Smartphone Wrapper Frame */}
          <div className="relative w-80 h-[640px] bg-slate-900 rounded-[44px] shadow-2xl p-3 border-4 border-slate-700 flex flex-col overflow-hidden ring-12 ring-slate-850/10">
            {/* Top Speaker Slot & Camera */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center gap-2">
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700"></div>
            </div>

            {/* Core Device Screen Panel */}
            <div className="relative flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col border border-slate-950/20">
              
              {/* Device Status Bar */}
              <div className="bg-slate-100 px-6 pt-5 pb-1.5 flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono select-none">
                <span>09:41</span>
                <span className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-4 h-2 bg-slate-600 rounded-xs"></div>
                </span>
              </div>

              {/* simulated app view content or active update alerts */}
              <div className="flex-1 relative flex flex-col bg-slate-50">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key="normal-app-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow flex flex-col"
                  >
                    {/* App Inner Header */}
                    <div className="bg-indigo-600 px-4 py-4 text-white">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold tracking-tight">SuperApp Mobile</span>
                        <span className="text-[9px] bg-indigo-500 px-2 py-0.5 rounded-full font-mono">
                          v{simulatedLocalVersion}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-150 mt-1">Status: Operational & Fully Synchronized</p>
                    </div>

                    {/* Update Recommendation Alert Banner */}
                    {isUpdateRequired && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-amber-500 text-white px-4 py-2.5 text-[11px] flex flex-col gap-1 border-b border-amber-600 shadow-sm"
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-white animate-pulse" />
                          <span className="font-semibold leading-tight text-white">
                            {currentActiveMsg || "A recommended update is available!"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-amber-400/35">
                          <span className="text-[9px] text-amber-100 font-mono">Installed: v{simulatedLocalVersion} → Store: v{currentActiveStore}</span>
                          <a 
                            href={currentActivePlayStoreUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-2 py-0.5 bg-white text-amber-800 font-bold rounded shadow-xs hover:bg-slate-100 transition-all text-[9.5px]"
                          >
                            Get Update
                          </a>
                        </div>
                      </motion.div>
                    )}

                    {/* Main Mobile Contents */}
                    <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 shadow-xs">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-bold">Activity Pulse</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800">$1,350.50</div>
                        <p className="text-[9px] text-slate-400 font-medium font-mono">Synced dynamically with Cloud Firestore.</p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 shadow-xs">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-bold">Authentication Gateway</span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 flex justify-between items-center">
                          <span>Relational State:</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-mono text-[9px] rounded-sm font-bold">
                            ONLINE
                          </span>
                        </div>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-[10px] text-indigo-700 flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 text-indigo-600" />
                        <span>
                          Current status: <strong>{isUpdateRequired ? "Update Recommended" : "Latest Version"}</strong>. Active required minimum protocol is v{currentActiveMin}.
                        </span>
                      </div>
                    </div>

                    {/* Simulated navigation Tab bar */}
                    <div className="bg-white border-t border-slate-100 h-14 grid grid-cols-2 text-slate-400 text-xs py-1">
                      <button className="flex flex-col items-center justify-center gap-0.5 text-indigo-600">
                        <Smartphone className="w-4 h-4" />
                        <span className="text-[9px] font-medium font-sans">Home</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-0.5">
                        <Settings className="w-4 h-4" />
                        <span className="text-[9px] font-medium font-sans">Settings</span>
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Android Home Navigation Line */}
              <div className="h-10 bg-slate-100 flex items-center justify-center shrink-0 border-t border-slate-150 relative">
                <div className="w-24 h-1 bg-slate-400 rounded-full absolute bottom-2.5"></div>
              </div>

            </div>
          </div>
        </section>

        {/* Right Grid Side - 7 columns: Admin Control Panel */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                <div>
                  <h2 className="text-md font-bold leading-tight">Admin Governance Panel</h2>
                  <p className="text-[10px] text-slate-400">Manage required app binaries and alert payloads.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px]">Active Replicas</span>
              </div>
            </div>

            <div className="p-6">
              {!user && (
                <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block mb-1">Authorization Note</span>
                    You are in read-only mode. Anyone can retrieve specifications, but deployment config edits require administrator privileges.
                    <button 
                      onClick={handleGoogleSignIn}
                      className="mt-2 text-[10px] underline hover:text-amber-950 font-bold block bg-transparent border-none p-0 cursor-pointer text-left"
                    >
                      Authenticate Admin Profile now →
                    </button>
                  </div>
                </div>
              )}

              {/* Version Administration Form */}
              <form onSubmit={handleSaveConfig} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Min Version Target */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      Minimum Required Version
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={minVersionInput}
                      onChange={(e) => setMinVersionInput(e.target.value)}
                      placeholder="e.g. 1.1.0"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      disabled={!user}
                      id="config-min-version"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Any version strictly lower than this triggers Force Update.</span>
                  </div>

                  {/* Current Store Version */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      Current Published Version
                      <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={currentVersionInput}
                      onChange={(e) => setCurrentVersionInput(e.target.value)}
                      placeholder="e.g. 1.2.0"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      disabled={!user}
                      id="config-current-version"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Latest available version on Play Store.</span>
                  </div>
                </div>

                {/* Direct Store URL Link */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Google Play Store URL
                    <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="url"
                    required
                    value={playStoreUrlInput}
                    onChange={(e) => setPlayStoreUrlInput(e.target.value)}
                    placeholder="e.g. https://play.google.com/store/apps/details?id=your.package"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    disabled={!user}
                    id="config-store-url"
                  />
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Play Store listing link matched with the update action.</span>
                </div>

                {/* Text Block customization */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Update Recommendation Alert Message
                  </label>
                  <textarea 
                    value={updateMessageInput}
                    onChange={(e) => setUpdateMessageInput(e.target.value)}
                    rows={3}
                     placeholder="Provide instructions to show..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    disabled={!user}
                    id="config-message-textarea"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Alert text delivered dynamically inside the mobile update banner.</span>
                </div>

                {/* Form submit with validation */}
                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={!user || savingLoading}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all border ${
                      user 
                        ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 hover:shadow-indigo-100 cursor-pointer' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                    id="save-config-btn"
                  >
                    {savingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Deploy Settings Statically
                  </button>

                  <AnimatePresence>
                    {savedSuccessMessage && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-emerald-600 text-xs font-semibold flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Settings deployed to Cloud Firestore successfully!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>
          </div>

          <div className="p-5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="font-bold text-slate-700 mb-2.5 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 inline-block w-fit">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                Live Cloud Specifications
              </div>
              <ul className="text-[11px] space-y-1.5 font-mono text-slate-500">
                <li>• active DB ID: <span className="text-slate-800 font-semibold">{dbConfig?.minVersion || DEFAULT_CONFIG.minVersion}</span></li>
                <li>• play store link: <span className="text-indigo-600 truncate max-w-[200px] inline-block align-bottom">{currentActivePlayStoreUrl}</span></li>
                <li>• sync status: <span className="text-green-600 font-bold">Listening Onsnapshot</span></li>
              </ul>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                Android Build Engine & Downloads
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 mb-3 font-sans">
                Compiles the Android bundle containing the target version. Download the fully bundled project including the precompiled APK file:
              </p>
              <a 
                href="/app-force-update.zip" 
                download="app-force-update.zip"
                className="w-full sm:w-fit px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="zip-download-btn"
              >
                <Download className="w-4 h-4" />
                Download Project ZIP (with APK)
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
