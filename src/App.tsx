import { useState, useEffect, useCallback, useRef } from "react";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment, collection, query, where, getDocs, addDoc, serverTimestamp, limit, runTransaction, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { 
  LayoutGrid, 
  PlusCircle, 
  Zap, 
  User, 
  Coins, 
  LogOut, 
  Settings, 
  Loader2, 
  Youtube, 
  History, 
  Info,
  Users,
  Heart,
  MessageSquare,
  Gift,
  ArrowRightLeft,
  ChevronRight,
  Play,
  UserPlus,
  TrendingUp,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Home,
  CreditCard,
  Shield,
  ShieldCheck,
  Copy,
  Globe,
  Clock,
  MessageCircle,
  Bot,
  ExternalLink,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import YouTube, { YouTubeProps } from "react-youtube";

// --- Types ---
interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  coins: number;
  createdAt: any;
  role?: 'admin' | 'user';
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
}

interface Promotion {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  type: "subscribe" | "like" | "comment";
  targetId: string;
  channelId?: string;
  videoId?: string;
  title: string;
  thumbnail: string;
  coinsPerAction: number;
  totalActions: number;
  completedActions: number;
  active: boolean;
  createdAt?: any;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'bonus' | 'referral' | 'promo';
  description: string;
  timestamp: any;
}

interface PromoCode {
  id: string;
  code: string;
  coins: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
}

interface DailyBonus {
  userId: string;
  lastClaimed: any;
}

interface ConnectedAccount {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  coins?: number;
}

// --- Components ---

function Login({ onLogin, isLoading, acceptedTerms1, setAcceptedTerms1, acceptedTerms2, setAcceptedTerms2, onOpenTerms, onOpenPrivacy }: { onLogin: () => void, isLoading: boolean, acceptedTerms1: boolean, setAcceptedTerms1: (val: boolean) => void, acceptedTerms2: boolean, setAcceptedTerms2: (val: boolean) => void, onOpenTerms: () => void, onOpenPrivacy: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-white text-slate-900 overflow-x-hidden relative">
      {/* Background Decorations */}
      <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl text-center z-10 px-6 pt-20 pb-12"
      >
        <div className="mb-10 flex justify-center">
          <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 px-8">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-600/20">
              <Youtube className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">TUBE FOLLOWER</span>
          </div>
        </div>

        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-slate-900 mb-6 leading-none uppercase">
          GROW YOUR <br />
          <span className="text-blue-600">CHANNEL REAL.</span>
        </h1>
        <p className="text-slate-500 text-lg sm:text-xl font-bold max-w-2xl mx-auto leading-relaxed mb-12">
          The official community-driven platform for YouTube creators. 
          Get real engagement, subscribers, and views through our secure exchange system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button 
            onClick={onLogin} 
            size="lg" 
            disabled={isLoading || !acceptedTerms1 || !acceptedTerms2}
            className="w-full sm:w-72 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-600/30 font-black text-xl transition-all active:scale-[0.98] group disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? (
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            ) : (
              <Zap className="mr-3 h-6 w-6 fill-white group-hover:animate-bounce" />
            )}
            {isLoading ? "Signing in..." : "Get Started Free"}
          </Button>
          
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-3 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
              <input type="checkbox" id="terms1" checked={acceptedTerms1} onChange={(e) => setAcceptedTerms1(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-blue-600" />
              <Label htmlFor="terms1" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                I agree to the <span className="text-blue-600 hover:underline" onClick={(e) => { e.preventDefault(); onOpenTerms(); }}>Terms</span>
              </Label>
            </div>
            <div className="flex items-center gap-3 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
              <input type="checkbox" id="terms2" checked={acceptedTerms2} onChange={(e) => setAcceptedTerms2(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-blue-600" />
              <Label htmlFor="terms2" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                I agree to the <span className="text-blue-600 hover:underline" onClick={(e) => { e.preventDefault(); onOpenPrivacy(); }}>Privacy Policy</span>
              </Label>
            </div>
          </div>
        </div>

        {/* Features Section (Explaining Purpose for Google) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-20">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase">Real Growth</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Get real subscribers, likes, and comments from active YouTube creators in our community.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="bg-red-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase">Auto Earning</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Earn coins automatically by supporting other creators. No manual work required.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase">Safe & Secure</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              We use official YouTube APIs and strict anti-cheat systems to keep your channel safe.
            </p>
          </div>
        </div>

        {/* Official Branding & Identity Section (Crucial for Google Verification) */}
        <div className="bg-white p-10 rounded-[3rem] text-left mb-20 border-2 border-blue-50 shadow-2xl shadow-blue-100/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase">Brand Identity & Verification</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official App Name</span>
                <span className="text-xl font-black text-slate-900">TUBE FOLLOWER</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Developer Support</span>
                <span className="text-xl font-black text-slate-900">tubefollowerhelp@gmail.com</span>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                TUBE FOLLOWER is a registered application dedicated to providing a transparent and secure environment for YouTube creators. 
                Our branding is consistently applied across all user interfaces to ensure trust and clarity.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Purpose Section for Google Verification */}
        <div className="bg-slate-50 p-10 rounded-[3rem] text-left mb-20 border border-slate-100">
          <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase">How TUBE FOLLOWER Works</h2>
          <div className="space-y-6 text-slate-600 font-medium">
            <p>
              TUBE FOLLOWER is a community exchange platform designed to help small YouTube creators gain visibility. 
              Our app facilitates a "support-for-support" ecosystem where users can discover new channels and content.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm h-fit"><Check className="text-blue-600 h-5 w-5" /></div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase">Discover Content</h4>
                  <p className="text-sm">Find channels that match your interests and support them.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm h-fit"><Check className="text-blue-600 h-5 w-5" /></div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase">Earn Rewards</h4>
                  <p className="text-sm">Earn virtual coins for every interaction which can be used for your own campaigns.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="inline-flex items-center gap-8 bg-slate-900 text-white px-10 py-6 rounded-[2rem] shadow-2xl mb-20">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black">10k+</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creators</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-700" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black">500k+</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Done</span>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="w-full max-w-6xl px-6 py-12 border-t border-slate-100 mt-auto z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-lg">
              <Youtube className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">TUBE FOLLOWER</span>
          </div>
          <div className="flex gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="mailto:tubefollowerhelp@gmail.com" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            © 2026 TUBE FOLLOWER • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}

function PrivacyPolicy({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const content = (
    <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
      <p>Last Updated: April 10, 2026</p>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. Introduction</h3>
        <p>TUBE FOLLOWER ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. Information We Collect</h3>
        <p>We collect information that you provide directly to us when you sign in via Google OAuth, including your name, email address, and profile picture. We also collect YouTube channel information and interaction status via YouTube API to provide our core services.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. How We Use Your Information</h3>
        <p>We use the collected information to manage your account, verify completion of YouTube tasks (subscriptions, likes), and maintain the integrity of our platform. We do not sell your data to third parties.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">4. YouTube API Services</h3>
        <p>Our app uses YouTube API Services. By using our app, you agree to be bound by the Google Privacy Policy (<a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://www.google.com/policies/privacy</a>) and YouTube Terms of Service.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">5. Contact Us</h3>
        <p>If you have any questions about this Privacy Policy, please contact us at tubefollowerhelp@gmail.com.</p>
      </section>
    </div>
  );

  if (!open && !onOpenChange) return content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-[32px] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Privacy Policy
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TermsOfService({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const content = (
    <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
      <p>Last Updated: April 10, 2026</p>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">1. Acceptance of Terms</h3>
        <p>By accessing or using TUBE FOLLOWER, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">2. User Conduct</h3>
        <p>You agree not to use bots or automated scripts to earn coins unfairly. Unsubscribing from channels after earning coins results in a penalty to maintain community fairness.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">3. Coin System</h3>
        <p>Coins earned in TUBE FOLLOWER have no monetary value and cannot be exchanged for real currency. They are used solely for promoting YouTube content within the app.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">4. Disclaimer</h3>
        <p>TUBE FOLLOWER is not affiliated with, endorsed by, or sponsored by Google or YouTube. We are an independent platform using public APIs.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">5. Contact Us</h3>
        <p>For any inquiries, please contact us at tubefollowerhelp@gmail.com.</p>
      </section>
    </div>
  );

  if (!open && !onOpenChange) return content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-[32px] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black flex items-center gap-3">
            <Info className="h-8 w-8 text-blue-600" />
            Terms and Conditions
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Root Component for Routing ---
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  const path = window.location.pathname;

  if (page === 'privacy' || path === '/privacy') {
    return (
      <div className="min-h-screen bg-white p-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Privacy Policy</h1>
          </div>
          <PrivacyPolicy open={false} onOpenChange={null as any} />
          <div className="mt-16 pt-10 border-t border-slate-100 flex justify-center">
            <Button onClick={() => window.location.href = '/'} variant="outline" size="lg" className="rounded-2xl font-black uppercase tracking-widest px-10 h-14 border-2 hover:bg-slate-50">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'terms' || path === '/terms') {
    return (
      <div className="min-h-screen bg-white p-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
              <Info className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Terms of Service</h1>
          </div>
          <TermsOfService open={false} onOpenChange={null as any} />
          <div className="mt-16 pt-10 border-t border-slate-100 flex justify-center">
            <Button onClick={() => window.location.href = '/'} variant="outline" size="lg" className="rounded-2xl font-black uppercase tracking-widest px-10 h-14 border-2 hover:bg-slate-50">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"home" | "get-coin" | "get-subscribe" | "admin">("home");
  const [filter, setFilter] = useState<"subscribe" | "like" | "comment">("subscribe");
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isGiftCodeOpen, setIsGiftCodeOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isAdvanceModeOpen, setIsAdvanceModeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isAdminPromoOpen, setIsAdminPromoOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [botLog, setBotLog] = useState<string[]>([]);

  const APP_VERSION = 1.1; // Current App Version

  useEffect(() => {
    // Inject Google Verification Tag as backup
    const meta = document.createElement('meta');
    meta.name = "google-site-verification";
    meta.content = "U49gM8HmBfcbtBfzeMP0oImjfKmHpeiG_K6ZgKvQZnM";
    document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    // Listen for app configuration/versioning
    const configRef = doc(db, "config", "app");
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.minVersion > APP_VERSION) {
          setIsUpdateRequired(true);
        }
      }
    }, (error) => {
      console.error("Config listener error:", error);
      // We don't use handleFirestoreError here to avoid blocking the app if config fails
    });
    return unsub;
  }, []);

  useEffect(() => {
    (window as any).openTroubleshooting = () => setIsTroubleshootingOpen(true);
  }, []);

  const addBotLog = (msg: string) => {
    setBotLog(prev => [msg, ...prev].slice(0, 5));
  };
  
  // Persisted state for Campaign tab
  const [campaignType, setCampaignType] = useState<"subscribe" | "like" | "comment">("subscribe");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [channelLogo, setChannelLogo] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ title: string, thumbnail: string, channelId?: string, videoId?: string } | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [referCodeInput, setReferCodeInput] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoStats, setAutoStats] = useState({ tasksCompleted: 0, coinsEarned: 0 });
  const [availablePromos, setAvailablePromos] = useState<Promotion[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [referralInput, setReferralInput] = useState("");
  const [isClaimingReferral, setIsClaimingReferral] = useState(false);
  const [acceptedTerms1, setAcceptedTerms1] = useState(false);
  const [acceptedTerms2, setAcceptedTerms2] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // Handle query params for direct policy access (Google requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page === 'privacy') {
      setShowPrivacyPolicy(true);
      // Ensure we don't show the login page if we are just viewing policy
      if (!user) setLoading(false);
    }
    if (page === 'terms') {
      setShowTermsOfService(true);
      if (!user) setLoading(false);
    }
  }, [user]);

  // Fetch real subscriber count and logo using Gemini with Google Search
  useEffect(() => {
    const trimmedUrl = youtubeUrl.trim();
    const isYoutube = trimmedUrl && (
      trimmedUrl.includes("youtube.com") || 
      trimmedUrl.includes("youtu.be") || 
      trimmedUrl.startsWith("@") ||
      (campaignType === "subscribe" && trimmedUrl.startsWith("UC") && trimmedUrl.length === 24) ||
      (campaignType === "like" && /^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl))
    );
    
    if (isYoutube) {
      const fetchMetadata = async (retries = 2, useSearch = false) => {
        setIsFetchingMetadata(true);
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            console.error("GEMINI_API_KEY is missing");
            return;
          }
          const ai = new GoogleGenAI({ apiKey });
          const isChannel = campaignType === "subscribe";
          
          // Local parsing hint
          let localHint = "";
          if (isChannel) {
            const ucMatch = trimmedUrl.match(/UC[a-zA-Z0-9_-]{22}/);
            if (ucMatch) localHint = `(Hint: Channel ID might be ${ucMatch[0]})`;
          } else {
            const vMatch = trimmedUrl.match(/[a-zA-Z0-9_-]{11}/);
            if (vMatch) localHint = `(Hint: Video ID might be ${vMatch[0]})`;
          }

          const prompt = `YouTube metadata for: ${trimmedUrl}. ${localHint}
          Return JSON ONLY: {
            "count": number,
            "logoUrl": "string",
            "title": "string",
            "channelId": "string (MUST be the 24-char UC... ID)",
            "videoId": "string (MUST be the 11-char video ID)"
          }`;

          const config: any = {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: "LOW" }
          };
          
          if (useSearch) {
            config.tools = [{ googleSearch: {} }];
          }

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config
          });
          
          let text = "";
          if (response.text) {
            text = response.text;
          } else if (response.candidates?.[0]?.content?.parts) {
            text = response.candidates[0].content.parts
              .map(part => part.text || "")
              .join(" ")
              .trim();
          }

          if (!text) {
            if (!useSearch && retries > 0) {
              console.warn("[Metadata] Empty response without search, retrying with search...");
              return fetchMetadata(retries - 1, true);
            }
            throw new Error("Empty response from Gemini");
          }
          
          // Clean up any potential markdown formatting
          text = text.replace(/```json/g, "").replace(/```/g, "").trim();
          
          let result;
          try {
            result = JSON.parse(text);
          } catch (parseError) {
            // Try to find JSON block if parsing failed
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No JSON found in response");
            }
          }

          if (result && result.count !== undefined) {
            let countVal = result.count;
            if (typeof countVal === 'string') {
              countVal = countVal.toLowerCase();
              const multiplier = countVal.endsWith('k') ? 1000 : countVal.endsWith('m') ? 1000000 : 1;
              countVal = parseFloat(countVal) * multiplier;
            }
            setSubscriberCount(Math.floor(Number(countVal)));
          }
          
          if (result.logoUrl) setChannelLogo(result.logoUrl);
          
          let cleanChannelId = result.channelId;
          if (cleanChannelId) {
            const ucMatch = cleanChannelId.match(/UC[a-zA-Z0-9_-]{22}/);
            if (ucMatch) cleanChannelId = ucMatch[0];
          }
          let cleanVideoId = result.videoId;
          if (cleanVideoId) {
            const vMatch = cleanVideoId.match(/[a-zA-Z0-9_-]{11}/);
            if (vMatch) cleanVideoId = vMatch[0];
          }
          
          setMetadata({ 
            title: result.title || (isChannel ? "YouTube Channel" : "YouTube Video"),
            thumbnail: result.logoUrl || "",
            channelId: cleanChannelId,
            videoId: cleanVideoId
          });
          setIsFetchingMetadata(false);
        } catch (e) {
          if (retries > 0) {
            console.warn(`Retrying Gemini call... (${retries} left)`, e);
            await new Promise(r => setTimeout(r, 1000));
            return fetchMetadata(retries - 1);
          }
          console.error("Error fetching YouTube metadata:", e);
          setIsFetchingMetadata(false);
        }
      };
      
      const timer = setTimeout(fetchMetadata, 200);
      return () => clearTimeout(timer);
    } else {
      // Only reset if the input is actually empty
      if (!trimmedUrl) {
        setSubscriberCount(0);
        setChannelLogo(null);
        setMetadata(null);
      }
      setIsFetchingMetadata(false);
    }
  }, [youtubeUrl, campaignType]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentAutoTask, setCurrentAutoTask] = useState<Promotion | null>(null);
  const [isDailyClaiming, setIsDailyClaiming] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const promosRef = useRef<Promotion[]>([]);

  // Admin check
  useEffect(() => {
    if (user?.email === "tubefollowerhelp@gmail.com") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Multi-Account Sync
  useEffect(() => {
    const saved = localStorage.getItem('connected_accounts');
    if (saved) {
      try {
        setConnectedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse connected accounts", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user && profile) {
      setConnectedAccounts(prev => {
        const exists = prev.find(a => a.uid === user.uid);
        const currentAcc = {
          uid: user.uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          email: user.email || "",
          coins: profile.coins
        };
        
        let newList;
        if (exists) {
          newList = prev.map(a => a.uid === user.uid ? currentAcc : a);
        } else {
          newList = [...prev, currentAcc];
        }
        localStorage.setItem('connected_accounts', JSON.stringify(newList));
        return newList;
      });
    }
  }, [user, profile?.coins]);

  useEffect(() => {
    const fetchAllCoins = async () => {
      if (!user || connectedAccounts.length <= 1) return;
      
      let total = 0;
      const updatedAccounts = await Promise.all(connectedAccounts.map(async (acc) => {
        if (acc.uid === user.uid) {
          const currentCoins = profile?.coins || 0;
          total += currentCoins;
          return { ...acc, coins: currentCoins };
        }
        try {
          const snap = await getDoc(doc(db, "users", acc.uid));
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            total += data.coins;
            return { ...acc, coins: data.coins };
          }
        } catch (e) {
          // Silently handle permission issues for other accounts in the list
          // This can happen if the user has accounts that they haven't logged into recently
          // or if the security rules are restrictive.
          if (!(e instanceof Error && e.message.includes("permission"))) {
            console.error(`Failed to fetch coins for ${acc.uid}`, e);
          }
          total += acc.coins || 0;
        }
        return acc;
      }));
      
      setTotalCoins(total);
      setConnectedAccounts(updatedAccounts);
    };

    const interval = setInterval(fetchAllCoins, 30000); // Sync every 30s
    fetchAllCoins();
    return () => clearInterval(interval);
  }, [user?.uid, connectedAccounts.length, profile?.coins]);

  // Fetch referral count
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "users"), where("referredBy", "==", profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReferralCount(snap.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "referrals");
    });
    return unsubscribe;
  }, [profile?.uid]);

  // Check Daily Bonus
  useEffect(() => {
    if (!profile) return;
    const checkDaily = async () => {
      try {
        const bonusDoc = await getDoc(doc(db, "daily_bonus", profile.uid));
        setIsOffline(false);
        if (!bonusDoc.exists()) {
          setCanClaimDaily(true);
          return;
        }
        const lastClaimed = bonusDoc.data().lastClaimed?.toDate();
        if (!lastClaimed) {
          setCanClaimDaily(true);
          return;
        }
        const now = new Date();
        const diff = now.getTime() - lastClaimed.getTime();
        const hours24 = 24 * 60 * 60 * 1000;
        setCanClaimDaily(diff >= hours24);
      } catch (e: any) {
        if (e.message?.includes("offline")) {
          setIsOffline(true);
        } else {
          console.error("Failed to check daily bonus", e);
        }
      }
    };
    checkDaily();
    const interval = setInterval(checkDaily, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [profile?.uid]);

  // Fetch completed tasks to filter them out
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "actions"), where("userId", "==", profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const ids = new Set(snap.docs.map(doc => doc.data().promotionId as string));
      setCompletedTaskIds(ids);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "actions");
    });
    return unsubscribe;
  }, [profile?.uid]);

  // Sync ref with state and filter completed
  useEffect(() => {
    promosRef.current = availablePromos.filter(p => !completedTaskIds.has(p.id));
  }, [availablePromos, completedTaskIds]);

  // Fetch available promotions for both Home list and Automation
  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, "promotions"),
      where("active", "==", true),
      where("userId", "!=", profile.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const p = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Promotion));
      setAvailablePromos(p);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "promotions");
    });

    return unsubscribe;
  }, [profile?.uid]);

  // Automation logic loop
  useEffect(() => {
    let isActive = true;
    let timeoutId: any;
    
    const runAutomation = async () => {
      if (!isActive || !isAutoRunning || !profile) return;

      // Ensure we have a token for real actions
      if (!googleAccessToken) {
        console.log("[Auto] No Google Access Token, stopping bot");
        setIsAutoRunning(false);
        toast.error("Please connect your YouTube account first to run the Auto Engine.", { id: "auto-no-token" });
        return;
      }

      toast.info("Auto Engine: Searching for tasks...", { id: "auto-searching", duration: 2000 });
      addBotLog("Searching for new tasks...");

      const currentPromos = promosRef.current.filter(p => p.active && p.completedActions < p.totalActions);
      console.log(`[Auto] Found ${currentPromos.length} potential promos`);
      
      if (currentPromos.length === 0) {
        setIsSearching(true);
        setCurrentAutoTask(null);
        if (isActive) timeoutId = setTimeout(runAutomation, 3000);
        return;
      }
      
      setIsSearching(false);
      const shuffled = [...currentPromos].sort(() => Math.random() - 0.5);
      
      let foundTask = false;
      for (const promo of shuffled) {
        try {
          if (!isActive) return;
          const currentUid = auth.currentUser?.uid;
          if (!currentUid || currentUid !== profile.uid) {
            console.log("[Auto] Auth state changed, stopping current loop");
            return;
          }

          const actionRef = doc(db, "actions", `${currentUid}_${promo.id}`);
          let actionSnap;
          try {
            actionSnap = await getDoc(actionRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `actions/${currentUid}_${promo.id}`);
            continue;
          }
          
          if (!actionSnap.exists()) {
            console.log(`[Auto] Bot starting task for promo: ${promo.id}`);
            setCurrentAutoTask(promo);
            addBotLog(`Found task: ${promo.title} (${promo.type})`);
            toast.info(`Auto Engine: Found task for ${promo.title}`, { id: "auto-task-found", duration: 3000 });
            
            // Simulate "Bot Working" delay (4 seconds)
            addBotLog("Bot is preparing action...");
            await new Promise(resolve => setTimeout(resolve, 4000));
            if (!isActive) return;
            
            addBotLog(`Attempting ${promo.type}...`);
            let actionSuccess = false;
            if (promo.type === 'subscribe') {
              let targetChannelId = promo.channelId || promo.targetId;
              
              // Local extraction for common URL formats to save Gemini calls
              if (targetChannelId.includes("youtube.com/channel/")) {
                const parts = targetChannelId.split("youtube.com/channel/");
                if (parts[1]) {
                  const id = parts[1].split(/[?#/]/)[0];
                  if (id.startsWith("UC") && id.length === 24) {
                    targetChannelId = id;
                  }
                }
              } else if (targetChannelId.includes("youtube.com/@")) {
                const parts = targetChannelId.split("youtube.com/@");
                if (parts[1]) {
                  targetChannelId = "@" + parts[1].split(/[?#/]/)[0];
                }
              }

              const isValidChannelId = (id: string) => id && id.startsWith('UC') && id.length === 24;

              if (!isValidChannelId(targetChannelId)) {
                addBotLog(`Resolving Channel ID for ${promo.title}...`);
                try {
                  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                  
                  const runRepair = async (useSearch = true): Promise<string> => {
                    const config: any = { 
                      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
                    };
                    if (useSearch) config.tools = [{ googleSearch: {} }];

                    const repair = await ai.models.generateContent({
                      model: "gemini-3-flash-preview",
                      contents: `Find the YouTube Channel ID (MUST start with UC and be 24 chars) for this handle or ID: ${targetChannelId}. 
                      The channel title is "${promo.title}".
                      Return ONLY the 24-character UC... ID as plain text.`,
                      config
                    });
                    
                    let repairedId = "";
                    if (repair.text) {
                      repairedId = repair.text.trim();
                    } else if (repair.candidates?.[0]?.content?.parts) {
                      repairedId = repair.candidates[0].content.parts
                        .map(part => part.text || "")
                        .join(" ")
                        .trim();
                    }

                    // Extract UC... ID using regex to be safe
                    const ucMatch = repairedId.match(/UC[a-zA-Z0-9_-]{22}/);
                    if (ucMatch) repairedId = ucMatch[0];

                    if (!repairedId && useSearch) {
                      console.warn("[Auto-Repair] Empty response with search, retrying without search...");
                      return runRepair(false);
                    }
                    return repairedId;
                  };

                  const repairedId = await runRepair();
                  if (isValidChannelId(repairedId)) {
                    targetChannelId = repairedId;
                    addBotLog(`Channel ID Resolved: ${targetChannelId}`);
                  } else {
                    addBotLog(`Failed to resolve ID for ${promo.title}`);
                    toast.error(`Auto Sub Failed: Could not resolve Channel ID for ${promo.title}`, { id: "auto-yt-error" });
                    continue;
                  }
                } catch (repairErr) {
                  addBotLog(`Error resolving ID: ${repairErr instanceof Error ? repairErr.message : "Unknown error"}`);
                  continue;
                }
              }

              try {
                addBotLog(`Subscribing to ${promo.title}...`);
                const response = await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    snippet: {
                      resourceId: {
                        kind: 'youtube#channel',
                        channelId: targetChannelId
                      }
                    }
                  })
                });
                
                if (!response.ok) {
                  const errData = await response.json();
                  console.error("[Auto] YouTube Subscription Error:", errData);
                  if (response.status === 401) {
                    addBotLog("Session expired. Please re-login.");
                    toast.error("YouTube session expired. Please re-login.");
                    setIsAutoRunning(false);
                    return;
                  }
                  // If already subscribed, we count it as success
                  if (errData.error?.errors?.[0]?.reason === 'subscriptionDuplicate') {
                    addBotLog("Already subscribed! Counting as success.");
                    actionSuccess = true;
                  } else if (errData.error?.message?.toLowerCase().includes("cannot be found") || errData.error?.message?.toLowerCase().includes("not found")) {
                    addBotLog("Channel not found. Skipping.");
                  } else if (errData.error?.code === 403) {
                    const isPermissionError = errData.error?.message?.toLowerCase().includes("permission") || 
                                            errData.error?.status === "PERMISSION_DENIED" ||
                                            errData.error?.errors?.[0]?.reason === "forbidden";
                    
                    if (isPermissionError) {
                      addBotLog("PERMISSION ERROR: Check the box!");
                      toast.error("Permission Error: You MUST check the 'Manage your YouTube account' box during login.", { id: "auto-yt-error", duration: 10000 });
                    } else {
                      addBotLog(`Access Denied: ${errData.error?.message || "Forbidden"}`);
                      toast.error(`Auto Sub Failed: ${errData.error?.message || "Access Forbidden"}`, { id: "auto-yt-error" });
                    }
                    if (errData.error?.message?.toLowerCase().includes("quota")) {
                      setIsAutoRunning(false);
                      return;
                    }
                  } else {
                    addBotLog(`API Error: ${errData.error?.message || "Failed"}`);
                    toast.error(`Auto Sub Failed: ${errData.error?.message || "Unknown error"}`, { id: "auto-yt-error" });
                  }
                } else {
                  addBotLog("Successfully Subscribed!");
                  toast.success(`Subscribed to ${promo.title}!`, { id: "auto-yt-success", position: "bottom-right" });
                  actionSuccess = true;
                }
              } catch (ytError) {
                console.error("[Auto] Failed real subscription:", ytError);
              }
            } else if (promo.type === 'like') {
              let targetVideoId = promo.videoId || promo.targetId;
              
              // Fallback: If targetVideoId doesn't look like a valid 11-char ID, try to resolve it
              const isValidVideoId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);

              if (!isValidVideoId(targetVideoId)) {
                console.log(`[Auto] Video ID format invalid: ${targetVideoId}. Attempting repair...`);
                try {
                  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                  const repair = await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: `Find the YouTube Video ID (11 chars) for this URL or ID: ${targetVideoId}. Return ONLY the 11-character ID as plain text.`,
                    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                  });
                  const repairedId = repair.text?.trim();
                  if (repairedId && isValidVideoId(repairedId)) {
                    targetVideoId = repairedId;
                    console.log(`[Auto] Repaired Video ID: ${targetVideoId}`);
                  }
                } catch (repairErr) {
                  console.error("[Auto] Video repair failed:", repairErr);
                }
              }

              try {
                console.log(`[Auto] Attempting real like for: ${targetVideoId}`);
                const response = await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${targetVideoId}&rating=like`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                  }
                });
                if (!response.ok) {
                  const errData = await response.json();
                  console.error("[Auto] YouTube Like Error:", errData);
                  addBotLog(`Error: ${errData.error?.message || "Failed"}`);
                  toast.error(`Auto Like Failed: ${errData.error?.message || "Unknown error"}`, { id: "auto-yt-error" });
                } else {
                  console.log("[Auto] Real like successful!");
                  addBotLog("Like Successful!");
                  toast.success("Auto: Liked on YouTube!", { id: "auto-yt-success", position: "bottom-right" });
                  actionSuccess = true;
                }
              } catch (ytError) {
                console.error("[Auto] Failed real like:", ytError);
              }
            }

            if (!actionSuccess) {
              console.log("[Auto] Action failed on YouTube, skipping Firestore update");
              continue;
            }

            // Re-check auth and auto-running state after delay
            const latestUid = auth.currentUser?.uid;
            if (!isActive || !isAutoRunning || latestUid !== currentUid) return;

            try {
              const batch = writeBatch(db);
              batch.set(actionRef, { 
                userId: currentUid, 
                promotionId: promo.id, 
                timestamp: serverTimestamp() 
              });
              
              batch.update(doc(db, "users", currentUid), { 
                coins: increment(promo.coinsPerAction) 
              });
              
              const txRef = doc(collection(db, "transactions"));
              batch.set(txRef, {
                userId: currentUid,
                amount: promo.coinsPerAction,
                type: 'earn',
                description: `Auto: ${promo.type} task`,
                timestamp: serverTimestamp()
              });

              if (profile.referredBy) {
                const referrerRef = doc(db, "users", profile.referredBy);
                const commission = Math.floor(promo.coinsPerAction * 0.1);
                if (commission > 0) {
                  batch.update(referrerRef, {
                    coins: increment(commission),
                    referralEarnings: increment(commission)
                  });
                  const refTxRef = doc(collection(db, "transactions"));
                  batch.set(refTxRef, {
                    userId: profile.referredBy,
                    amount: commission,
                    type: 'referral',
                    description: `Commission from ${profile.displayName}`,
                    timestamp: serverTimestamp()
                  });
                }
              }
              
              batch.update(doc(db, "promotions", promo.id), { 
                completedActions: increment(1) 
              });

              await batch.commit();

              setCurrentAutoTask(null);
              setAutoStats(prev => ({
                tasksCompleted: prev.tasksCompleted + 1,
                coinsEarned: prev.coinsEarned + promo.coinsPerAction
              }));
              
              setAvailablePromos(prev => prev.filter(p => p.id !== promo.id));
              toast.success(`Auto: +${promo.coinsPerAction} Coins!`, { position: "top-right" });
              
              foundTask = true;
              break;
            } catch (error) {
              setCurrentAutoTask(null);
              handleFirestoreError(error, OperationType.WRITE, `actions/${currentUid}_${promo.id}`);
            }
          } else {
            console.log(`[Auto] Task already done for promo: ${promo.id}`);
            if (currentAutoTask?.id === promo.id) {
              setCurrentAutoTask(null);
            }
          }
        } catch (error) {
          console.error("[Auto] Error:", error);
        }
      }

      if (!foundTask) {
        console.log("[Auto] No new tasks found in this batch, retrying...");
        setIsSearching(true);
        if (isActive) timeoutId = setTimeout(runAutomation, 3000);
      } else {
        if (isActive) timeoutId = setTimeout(runAutomation, 5000);
      }
    };

    if (isAutoRunning) {
      timeoutId = setTimeout(runAutomation, 1000);
    }

    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAutoRunning, profile?.uid, googleAccessToken]);

  const recordTransaction = async (userId: string, amount: number, type: Transaction['type'], description: string) => {
    try {
      await addDoc(collection(db, "transactions"), {
        userId,
        amount,
        type,
        description,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to record transaction:", error);
      handleFirestoreError(error, OperationType.WRITE, "transactions");
    }
  };

  // --- Unsubscribe Detection ---
  const verifySubscription = async (promoId: string, channelId: string) => {
    if (!googleAccessToken || !profile) return;
    if (!promoId || !channelId) {
      console.warn("[Verify] Missing promoId or channelId:", { promoId, channelId });
      return;
    }
    
    try {
      // Check if user is still subscribed
      const res = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId=${channelId}`, {
        headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      });
      const data = await res.json();
      
      const isSubscribed = data?.items && Array.isArray(data.items) && data.items.length > 0;
      
      if (!isSubscribed) {
        console.log(`[Verify] User unsubscribed from ${channelId}. Penalizing...`);
        
        let promoDoc;
        try {
          promoDoc = await getDoc(doc(db, "promotions", promoId));
        } catch (err) {
          console.error("[Verify] Failed to get promo doc:", err);
          handleFirestoreError(err, OperationType.GET, `promotions/${promoId}`);
          return;
        }

        if (promoDoc.exists()) {
          const promo = promoDoc.data() as Promotion;
          const penalty = 16; 
          
          try {
            await updateDoc(doc(db, "users", profile.uid), {
              coins: increment(-penalty)
            });
          } catch (err) {
            console.error("[Verify] Failed to update user coins:", err);
            handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
            return;
          }
          
          await recordTransaction(profile.uid, -penalty, 'spend', `Penalty: Unsubscribed from ${promo.title}`);
          toast.error(`Cheating Detected! -${penalty} Coins deducted for unsubscribing from ${promo.title}.`, { duration: 6000 });
          
          // Remove the action record so they can't just sub again for more coins
          try {
            await setDoc(doc(db, "actions", `${profile.uid}_${promoId}`), {
              cheated: true,
              timestamp: serverTimestamp()
            }, { merge: true });
          } catch (err) {
            console.error("[Verify] Failed to update action record:", err);
            handleFirestoreError(err, OperationType.WRITE, `actions/${profile.uid}_${promoId}`);
            return;
          }
        }
      }
    } catch (e) {
      console.error("[Verify] Failed to verify subscription:", e);
    }
  };

  // Periodically verify a random completed task
  useEffect(() => {
    if (!profile || !googleAccessToken || completedTaskIds.size === 0) return;
    
    const interval = setInterval(async () => {
      const ids = Array.from(completedTaskIds);
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      
      // Fetch the action to get the promotion details
      const actionSnap = await getDoc(doc(db, "actions", `${profile.uid}_${randomId}`));
      if (actionSnap.exists() && !actionSnap.data().cheated) {
        const promoSnap = await getDoc(doc(db, "promotions", randomId));
        if (promoSnap.exists()) {
          const promo = promoSnap.data() as Promotion;
          if (promo.type === 'subscribe' && promo.channelId) {
            verifySubscription(randomId, promo.channelId);
          }
        }
      }
    }, 60000 * 5); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, [profile?.uid, googleAccessToken, completedTaskIds.size]);

  // Auth Listener
  useEffect(() => {
    let userUnsubscribe: (() => void) | undefined;
    
    const authUnsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Clean up previous user listener
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = undefined;
      }

      if (u) {
        // Restore token from user-specific session storage if available
        const savedToken = sessionStorage.getItem(`google_access_token_${u.uid}`);
        if (savedToken) {
          setGoogleAccessToken(savedToken);
        } else {
          // Fallback to generic key for backward compatibility or if it was just set
          const genericToken = sessionStorage.getItem('google_access_token');
          if (genericToken) setGoogleAccessToken(genericToken);
        }

        const userRef = doc(db, "users", u.uid);
        
        // Initial fetch
        try {
          const userSnap = await getDoc(userRef);
          setIsOffline(false);
          if (!userSnap.exists()) {
            setIsNewUser(true);
            const referralCode = u.uid.slice(0, 6).toUpperCase();
            const newProfile = {
              uid: u.uid,
              displayName: u.displayName || "User",
              photoURL: u.photoURL || "",
              coins: 100,
              referralCode,
              referralEarnings: 0,
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            await recordTransaction(u.uid, 100, 'bonus', 'Welcome bonus');
          }
        } catch (error: any) {
          if (error.message?.includes("offline")) {
            setIsOffline(true);
          } else {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`, u);
          }
        }
        
        // Real-time listener
        userUnsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`, u);
        });

        // Fetch transactions
        const tQuery = query(collection(db, "transactions"), where("userId", "==", u.uid), limit(20));
        onSnapshot(tQuery, (snap) => {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, "transactions", u);
        });
      } else {
        setProfile(null);
        setGoogleAccessToken(null);
        // Clear generic token on logout
        sessionStorage.removeItem('google_access_token');
      }
      setLoading(false);
    });
    
    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  const handleLogin = async (emailOrEvent?: any) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setIsAutoRunning(false); // Stop auto engine when switching accounts
    try {
      const email = typeof emailOrEvent === 'string' ? emailOrEvent : undefined;
      
      // If we are already logged in as this user, just close the dialog and return
      if (email && auth.currentUser?.email === email) {
        console.log(`[Auth] Already logged in as ${email}, skipping...`);
        setIsLoggingIn(false);
        setIsAccountsOpen(false);
        return;
      }

      // If we have an email, check if we already have a valid token for this account
      // to avoid unnecessary popups
      if (email) {
        const targetAcc = connectedAccounts.find(a => a.email === email);
        if (targetAcc) {
          const storedToken = sessionStorage.getItem(`google_access_token_${targetAcc.uid}`);
          if (storedToken) {
            console.log(`[Auth] Found existing token for ${email}, switching instantly...`);
            // We still need to sign in with Firebase to switch the active user
            // but we can try to use the login_hint to make it faster
          }
        }
      }

      if (email) {
        googleProvider.setCustomParameters({ 
          login_hint: email 
        });
      } else {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      }
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        setGoogleAccessToken(credential.accessToken || null);
        if (credential.accessToken && result.user) {
          sessionStorage.setItem(`google_access_token_${result.user.uid}`, credential.accessToken);
          sessionStorage.setItem('google_access_token', credential.accessToken); // Keep generic for compatibility
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup cancelled or closed.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Popup Blocked! Please allow popups in your browser settings to sign in.");
      } else {
        toast.error("Login failed. Please try again.");
        console.error("Login Error:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectYouTube = async () => {
    if (isConnecting) return false;
    setIsConnecting(true);
    
    // Notify user that a popup is coming
    const loadingToast = toast.loading("Opening Google Secure Login...");
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube');
      // Force account selection AND consent screen to ensure checkboxes appear
      provider.setCustomParameters({ 
        prompt: 'select_account consent',
        access_type: 'offline'
      });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      console.log("[OAuth] Login Success. ProviderData:", result.user.providerData);
      console.log("[OAuth] Access Token obtained:", credential?.accessToken ? "YES" : "NO");
      
      toast.dismiss(loadingToast);
      
      if (credential?.accessToken && auth.currentUser) {
        console.log("Successfully got Access Token. Verifying with YouTube API...");
        const token = credential.accessToken;

        // Save token to Firestore for persistence
        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            youtubeToken: token,
            youtubeConnectedAt: serverTimestamp()
          });
          console.log("[OAuth] Token saved to Firestore");
        } catch (e) {
          console.error("[OAuth] Failed to save token to Firestore:", e);
        }

        try {
          // Verify API Access by fetching user's own channel info
          const verifyRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const verifyData = await verifyRes.json();
          
          if (verifyRes.ok) {
            if (!verifyData.items || verifyData.items.length === 0) {
              toast.error("No YouTube Channel found! Please go to YouTube and click 'Create a Channel' first.", { duration: 8000 });
              setIsConnecting(false);
              return false;
            }
            
            console.log("YouTube Verification Success:", verifyData);
            setGoogleAccessToken(token);
            sessionStorage.setItem(`google_access_token_${auth.currentUser.uid}`, token);
            sessionStorage.setItem('google_access_token', token);
            toast.success("YouTube Connected Successfully!");
            setIsConnecting(false);
            return true;
          } else {
            console.error("YouTube API Verification Failed:", verifyData);
            
            const errorMsg = verifyData.error?.message || "";
            if (errorMsg.includes("YouTube Data API v3 has not been used") || errorMsg.includes("disabled")) {
              toast.error("CRITICAL: YouTube API is DISABLED in your Google Cloud Console. Click the 'ENABLE API' button in the Setup Guide!", { duration: 20000 });
            } else if (verifyData.error?.code === 403 || verifyData.error?.status === "PERMISSION_DENIED") {
              toast.error("Permission Denied: You MUST check the box to 'Manage your YouTube account' on the Google screen.", { duration: 15000 });
            } else {
              toast.error(`Connection Error: ${verifyData.error?.message || "Could not verify YouTube access"}`);
            }
            setIsConnecting(false);
            return false;
          }
        } catch (apiErr) {
          console.error("API Error during verification:", apiErr);
          toast.error("Network error while connecting to YouTube.");
          setIsConnecting(false);
          return false;
        }
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("YouTube Connection Error Details:", {
        code: error.code,
        message: error.message,
        customData: error.customData,
        fullError: error
      });
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Connection Failed: You closed the window before finishing. You MUST click 'Continue' on the permissions screen.", { duration: 8000 });
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.error("Connection cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Popup Blocked: Please allow popups for this site in your browser settings.");
      } else if (error.message?.includes("access_denied") || error.code?.includes("access-denied")) {
        toast.error("Access Denied: Did you click 'Continue' on the Google permissions screen? You must check the boxes to allow YouTube access.", { duration: 10000 });
      } else {
        toast.error("Access Blocked: 1. Enable 'YouTube Data API v3' in Google Library. 2. Ensure your email is a 'Test User'.", { duration: 10000 });
      }
    } finally {
      setIsConnecting(false);
    }
    return false;
  };

  const removeAccount = (uid: string) => {
    setConnectedAccounts(prev => {
      const newList = prev.filter(a => a.uid !== uid);
      localStorage.setItem('connected_accounts', JSON.stringify(newList));
      return newList;
    });
    toast.success("Account removed from list");
  };

  const handleTransfer = async () => {
    if (!profile || !transferAmount || !transferRecipient) return;
    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    if (profile.coins < amount) {
      toast.error("Insufficient coins");
      return;
    }
    if (transferRecipient === profile.uid) {
      toast.error("Cannot transfer to yourself");
      return;
    }

    setIsTransferring(true);
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, "users", profile.uid);
        const recipientRef = doc(db, "users", transferRecipient);
        
        const senderDoc = await transaction.get(senderRef);
        const recipientDoc = await transaction.get(recipientRef);
        
        if (!senderDoc.exists()) throw new Error("Sender not found");
        if (!recipientDoc.exists()) throw new Error("Recipient not found");
        
        const senderData = senderDoc.data() as UserProfile;
        if (senderData.coins < amount) throw new Error("Insufficient coins");
        
        // 1. Update sender
        transaction.update(senderRef, {
          coins: increment(-amount)
        });
        
        // 2. Update recipient
        transaction.update(recipientRef, {
          coins: increment(amount)
        });
        
        // 3. Record transfer in transfers collection
        const transferRef = doc(collection(db, "transfers"));
        transaction.set(transferRef, {
          fromUserId: profile.uid,
          toUserId: transferRecipient,
          amount,
          timestamp: serverTimestamp()
        });
        
        // 4. Record transactions for both
        const senderTxRef = doc(collection(db, "transactions"));
        transaction.set(senderTxRef, {
          userId: profile.uid,
          amount: -amount,
          type: 'spend',
          description: `Transfer to ${recipientDoc.data().displayName || transferRecipient}`,
          timestamp: serverTimestamp()
        });
        
        const recipientTxRef = doc(collection(db, "transactions"));
        transaction.set(recipientTxRef, {
          userId: transferRecipient,
          amount: amount,
          type: 'earn',
          description: `Transfer from ${profile.displayName}`,
          timestamp: serverTimestamp()
        });
      });

      toast.success(`Transferred ${amount} coins successfully!`);
      setIsTransferOpen(false);
      setTransferAmount("");
      setTransferRecipient("");
    } catch (error: any) {
      console.error("Transfer error:", error);
      if (error.message === "Recipient not found") {
        toast.error("Recipient not found");
      } else if (error.message === "Insufficient coins") {
        toast.error("Insufficient coins");
      } else {
        handleFirestoreError(error, OperationType.WRITE, `transfers/${transferRecipient}`);
        toast.error("Transfer failed");
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClaimPromo = async (code: string) => {
    if (!profile) return;
    try {
      const q = query(collection(db, "promo_codes"), where("code", "==", code.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("Invalid promo code");
        return;
      }
      const promoDoc = snap.docs[0];
      const promo = { id: promoDoc.id, ...promoDoc.data() } as PromoCode;
      
      if (promo.usedCount >= promo.maxUses) {
        toast.error("Promo code expired");
        return;
      }
      if (promo.usedBy.includes(profile.uid)) {
        toast.error("You already used this code");
        return;
      }

      const batch = writeBatch(db);
      
      // 1. Update promo code
      batch.update(doc(db, "promo_codes", promo.id), {
        usedCount: increment(1),
        usedBy: [...promo.usedBy, profile.uid]
      });
      
      // 2. Add coins to user
      batch.update(doc(db, "users", profile.uid), {
        coins: increment(promo.coins)
      });
      
      // 3. Record transaction
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
        userId: profile.uid,
        amount: promo.coins,
        type: 'promo',
        description: `Promo code: ${code}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      
      toast.success(`Promo code applied! +${promo.coins} Coins`);
      setIsGiftCodeOpen(false);
    } catch (error) {
      toast.error("Failed to claim code");
    }
  };

  const handleClaimDailyBonus = async () => {
    if (!profile || isDailyClaiming) return;
    setIsDailyClaiming(true);
    try {
      const bonusDoc = await getDoc(doc(db, "daily_bonus", profile.uid));
      const now = new Date();
      
      if (bonusDoc.exists()) {
        const lastClaimed = bonusDoc.data().lastClaimed.toDate();
        const diff = now.getTime() - lastClaimed.getTime();
        const hours24 = 24 * 60 * 60 * 1000;
        
        if (diff < hours24) {
          const remaining = hours24 - diff;
          const hours = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          toast.error(`Already claimed! Try again in ${hours}h ${minutes}m`);
          return;
        }
      }

      const bonusAmount = 50;
      const batch = writeBatch(db);
      
      batch.set(doc(db, "daily_bonus", profile.uid), {
        userId: profile.uid,
        lastClaimed: serverTimestamp()
      });
      
      batch.update(doc(db, "users", profile.uid), {
        coins: increment(bonusAmount)
      });
      
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
        userId: profile.uid,
        amount: bonusAmount,
        type: 'bonus',
        description: 'Daily login bonus',
        timestamp: serverTimestamp()
      });

      await batch.commit();
      
      toast.success(`Daily bonus claimed! +${bonusAmount} Coins`);
      setCanClaimDaily(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `daily_bonus/${profile.uid}`);
      toast.error("Failed to claim daily bonus");
    } finally {
      setIsDailyClaiming(false);
    }
  };

  const handleReferralSubmit = async () => {
    const codeToApply = referralInput || referCodeInput;
    if (!profile || !codeToApply) return;
    try {
      const q = query(collection(db, "users"), where("referralCode", "==", codeToApply.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("Invalid referral code");
        return;
      }
      const referrer = snap.docs[0].data() as UserProfile;
      if (referrer.uid === profile.uid || codeToApply.toUpperCase() === `REF-${profile.uid.slice(0, 6).toUpperCase()}`) {
        toast.error("Self-referrals are not allowed");
        return;
      }

      const batch = writeBatch(db);
      
      // 1. Update current user
      batch.update(doc(db, "users", profile.uid), {
        referredBy: referrer.uid,
        coins: increment(100)
      });
      
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
        userId: profile.uid,
        amount: 100,
        type: 'referral',
        description: `Referral bonus from ${referrer.displayName}`,
        timestamp: serverTimestamp()
      });
      
      // 2. Update referrer
      batch.update(doc(db, "users", referrer.uid), {
        coins: increment(50),
        referralEarnings: increment(50)
      });
      
      const refTxRef = doc(collection(db, "transactions"));
      batch.set(refTxRef, {
        userId: referrer.uid,
        amount: 50,
        type: 'referral',
        description: `Referral bonus for inviting ${profile.displayName}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();

      toast.success("Referral bonus claimed!");
      setIsReferralOpen(false);
      setIsNewUser(false);
      // Trigger tutorial after referral
      setIsTutorialOpen(true);
      setTutorialStep(0);
    } catch (error) {
      toast.error("Failed to apply referral");
    }
  };

  const handleSupportAI = async (message: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful support assistant for NivaBoost, a YouTube growth app. Help the user with their query: ${message}`,
      });
      return response.text;
    } catch (error) {
      return "Sorry, I'm having trouble connecting to support right now.";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#2196F3]" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login 
          onLogin={handleLogin} 
          isLoading={isLoggingIn} 
          acceptedTerms1={acceptedTerms1} 
          setAcceptedTerms1={setAcceptedTerms1} 
          acceptedTerms2={acceptedTerms2} 
          setAcceptedTerms2={setAcceptedTerms2}
          onOpenTerms={() => setShowTermsOfService(true)}
          onOpenPrivacy={() => setShowPrivacyPolicy(true)}
        />
        <PrivacyPolicy open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy} />
        <TermsOfService open={showTermsOfService} onOpenChange={setShowTermsOfService} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600/10 pb-24 flex flex-col overflow-x-hidden">
      <Toaster position="top-center" richColors />
      <PrivacyPolicy open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy} />
      <TermsOfService open={showTermsOfService} onOpenChange={setShowTermsOfService} />

      {isOffline && (
        <div className="bg-amber-500 text-white text-center py-2 text-xs font-bold sticky top-0 z-[100] flex items-center justify-center gap-2">
          <AlertCircle className="h-3 w-3" />
          Offline Mode: Some features may be limited.
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-none"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Referral Dialog for New Users */}
      <Dialog open={isNewUser} onOpenChange={setIsNewUser}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-[360px]">
          <DialogHeader className="space-y-4">
            <div className="mx-auto bg-blue-100 p-4 rounded-3xl w-fit">
              <Users className="h-10 w-10 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-center">Got a Refer Code?</DialogTitle>
            <p className="text-slate-500 text-center font-medium">Enter it now to get 100 bonus coins instantly!</p>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <Input 
              placeholder="ENTER CODE" 
              className="h-16 rounded-2xl bg-slate-50 border-slate-200 text-center text-xl font-black uppercase tracking-widest"
              value={referCodeInput}
              onChange={(e) => setReferCodeInput(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => {
                setIsNewUser(false);
                setIsTutorialOpen(true);
                setTutorialStep(0);
              }}>Skip</Button>
              <Button className="flex-1 h-14 rounded-2xl bg-blue-600 font-black shadow-lg shadow-blue-600/20" onClick={handleReferralSubmit}>Claim 100</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl p-0 max-w-[400px] overflow-hidden">
          <div className="bg-slate-900 p-8 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <History className="h-7 w-7 text-blue-400" />
              Transactions
            </DialogTitle>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-slate-50">
            {transactions.length > 0 ? transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    t.type === 'earn' ? 'bg-green-100 text-green-600' : 
                    t.type === 'spend' ? 'bg-red-100 text-red-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {t.type === 'earn' ? <TrendingUp className="h-5 w-5" /> : 
                     t.type === 'spend' ? <CreditCard className="h-5 w-5" /> : 
                     <Gift className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800">{t.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString() : 'Pending'}</p>
                  </div>
                </div>
                <span className={`font-black ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-bold">No transactions yet</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Promo Dialog */}
      <Dialog open={isAdminPromoOpen} onOpenChange={setIsAdminPromoOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Create Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Code</Label>
              <Input id="promo-code" placeholder="WELCOME500" className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-black uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Coins</Label>
                <Input id="promo-coins" type="number" placeholder="500" className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Uses</Label>
                <Input id="promo-uses" type="number" placeholder="100" className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold" />
              </div>
            </div>
            <Button className="w-full h-16 rounded-2xl bg-slate-900 font-black text-lg mt-4" onClick={async () => {
              const code = (document.getElementById('promo-code') as HTMLInputElement).value;
              const coins = parseInt((document.getElementById('promo-coins') as HTMLInputElement).value);
              const maxUses = parseInt((document.getElementById('promo-uses') as HTMLInputElement).value);
              if (!code || isNaN(coins) || isNaN(maxUses)) return;
              await addDoc(collection(db, "promo_codes"), {
                code: code.toUpperCase(),
                coins,
                maxUses,
                usedCount: 0,
                usedBy: [],
                createdAt: serverTimestamp()
              });
              toast.success("Promo code created!");
              setIsAdminPromoOpen(false);
            }}>Launch Code</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-0 max-w-[400px] overflow-hidden flex flex-col h-[500px]">
          <div className="bg-[#2196F3] p-6 text-white shrink-0">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Bot className="h-6 w-6" />
              Booster AI
            </DialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50" id="support-chat">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm max-w-[80%]">
              <p className="text-sm font-bold text-slate-700">Hello! I am your new Booster. How can I help you grow today?</p>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <Input id="support-input" placeholder="Type your message..." className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium" onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                const msg = input.value;
                if (!msg) return;
                input.value = '';
                const chat = document.getElementById('support-chat')!;
                chat.innerHTML += `<div class="flex justify-end"><div class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]"><p class="text-sm font-bold">${msg}</p></div></div>`;
                chat.scrollTop = chat.scrollHeight;
                const response = await handleSupportAI(msg);
                chat.innerHTML += `<div class="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm max-w-[80%]"><p class="text-sm font-bold text-slate-700">${response}</p></div>`;
                chat.scrollTop = chat.scrollHeight;
              }
            }} />
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 shrink-0"
              onClick={async () => {
                const input = document.getElementById('support-input') as HTMLInputElement;
                const msg = input.value;
                if (!msg) return;
                input.value = '';
                const chat = document.getElementById('support-chat')!;
                chat.innerHTML += `<div class="flex justify-end"><div class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]"><p class="text-sm font-bold">${msg}</p></div></div>`;
                chat.scrollTop = chat.scrollHeight;
                const response = await handleSupportAI(msg);
                chat.innerHTML += `<div class="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm max-w-[80%]"><p class="text-sm font-bold text-slate-700">${response}</p></div>`;
                chat.scrollTop = chat.scrollHeight;
              }}
            >
              <Plus className="h-6 w-6 rotate-45" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Header - Matching Screenshot */}
      <div className="bg-[#2196F3] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="relative cursor-pointer group" onClick={() => setIsAccountsOpen(true)}>
          <Avatar className="h-12 w-12 border-2 border-white group-hover:scale-105 transition-transform">
            <AvatarImage src={profile?.photoURL} />
            <AvatarFallback>{profile?.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-[#2196F3]">
            <Plus className="h-3 w-3 text-[#2196F3]" />
          </div>
        </div>
        
        <div className="bg-white rounded-full px-6 py-1.5 flex items-center gap-3 shadow-inner">
          <div className="bg-yellow-400 rounded-full p-1">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">
            {isAdmin ? "∞" : (profile?.coins || 0)}
          </span>
        </div>

        <button 
          className="text-white hover:opacity-80 transition-opacity"
          onClick={() => {
            setIsTutorialOpen(true);
            setTutorialStep(0);
          }}
        >
          <HelpCircle className="h-8 w-8" />
        </button>
      </div>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {isTutorialOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <div className="relative w-full max-w-sm">
              <motion.div
                key={tutorialStep}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                className="bg-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#2196F3]" />
                
                {tutorialStep === 0 && (
                  <div className="space-y-6 text-center">
                    <div className="bg-blue-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 rotate-3">
                      <Zap className="h-12 w-12 text-[#2196F3] fill-[#2196F3]" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Welcome!</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">Let's show you how to grow your channel to 1,000+ subscribers fast.</p>
                    </div>
                    <Button 
                      className="w-full h-16 bg-[#2196F3] hover:bg-[#1976D2] rounded-2xl font-black text-lg text-white shadow-lg"
                      onClick={() => setTutorialStep(1)}
                    >
                      Next Step
                    </Button>
                  </div>
                )}
                
                {tutorialStep === 1 && (
                  <div className="space-y-6 text-center">
                    <div className="bg-yellow-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 -rotate-3">
                      <Coins className="h-12 w-12 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Earn Coins</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">Go to the <span className="text-blue-600 font-black">Earn</span> tab. Subscribe or like other channels to get coins instantly.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" className="h-16 rounded-2xl font-bold" onClick={() => setTutorialStep(0)}>Back</Button>
                      <Button 
                        className="flex-1 h-16 bg-[#2196F3] hover:bg-[#1976D2] rounded-2xl font-black text-lg text-white shadow-lg"
                        onClick={() => setTutorialStep(2)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                
                {tutorialStep === 2 && (
                  <div className="space-y-6 text-center">
                    <div className="bg-purple-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 rotate-3">
                      <Zap className="h-12 w-12 text-purple-600 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Auto Engine</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">Turn on the <span className="text-purple-600 font-black">Auto Engine</span> in the Earn tab. It completes tasks for you automatically!</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" className="h-16 rounded-2xl font-bold" onClick={() => setTutorialStep(1)}>Back</Button>
                      <Button 
                        className="flex-1 h-16 bg-[#2196F3] hover:bg-[#1976D2] rounded-2xl font-black text-lg text-white shadow-lg"
                        onClick={() => setTutorialStep(3)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {tutorialStep === 3 && (
                  <div className="space-y-6 text-center">
                    <div className="bg-green-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 -rotate-3">
                      <TrendingUp className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Get Growth</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">Use your coins in the <span className="text-green-600 font-black">Campaign</span> tab to get real subscribers and likes.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" className="h-16 rounded-2xl font-bold" onClick={() => setTutorialStep(2)}>Back</Button>
                      <Button 
                        className="flex-1 h-16 bg-[#2196F3] hover:bg-[#1976D2] rounded-2xl font-black text-lg text-white shadow-lg"
                        onClick={() => setTutorialStep(4)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {tutorialStep === 4 && (
                  <div className="space-y-6 text-center">
                    <div className="bg-slate-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 rotate-3">
                      <CheckCircle2 className="h-12 w-12 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Ready!</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">You're all set. Start growing your channel now!</p>
                    </div>
                    <Button 
                      className="w-full h-16 bg-slate-900 hover:bg-black rounded-2xl font-black text-lg text-white shadow-xl"
                      onClick={() => setIsTutorialOpen(false)}
                    >
                      Finish Tutorial
                    </Button>
                  </div>
                )}

                <div className="mt-8 flex justify-center gap-2">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <div 
                      key={s} 
                      className={`h-2 rounded-full transition-all duration-300 ${tutorialStep === s ? "w-8 bg-[#2196F3]" : "w-2 bg-slate-200"}`}
                    />
                  ))}
                </div>
              </motion.div>
              
              <button 
                className="absolute -top-12 right-0 text-white/60 hover:text-white font-bold flex items-center gap-2 transition-colors"
                onClick={() => setIsTutorialOpen(false)}
              >
                Skip Tutorial <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-scroll pb-28">
        <div className="w-full max-w-md mx-auto transition-all duration-300">
            {activeTab === "home" && (
              <div className="p-4 space-y-6">
                <HomeTab 
                  profile={profile} 
                  user={user}
                  onLogout={() => signOut(auth)}
                  onOpenTransfer={() => setIsTransferOpen(true)}
                  onOpenFAQ={() => setIsFAQOpen(true)}
                  onOpenGiftCode={() => setIsGiftCodeOpen(true)}
                  onOpenInvite={() => setIsInviteOpen(true)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenAccounts={() => setIsAccountsOpen(true)}
                  onOpenTransactions={() => setIsTransactionsOpen(true)}
                  onOpenAdminPromo={() => setIsAdminPromoOpen(true)}
                  onOpenSupport={() => setIsSupportOpen(true)}
                  onClaimDailyBonus={handleClaimDailyBonus}
                  canClaimDaily={canClaimDaily}
                  isAdmin={isAdmin}
                  connectedAccounts={connectedAccounts}
                />
              </div>
            )}
            {activeTab === "get-coin" && (
              <div className="p-4 space-y-6">
                <GetCoinTab 
                  profile={profile} 
                  filter={filter} 
                  setFilter={setFilter} 
                  isAutoRunning={isAutoRunning}
                  setIsAutoRunning={setIsAutoRunning}
                  googleAccessToken={googleAccessToken}
                  onConnectYouTube={handleConnectYouTube}
                  autoStats={autoStats}
                  isSearching={isSearching}
                  currentAutoTask={currentAutoTask}
                  setCurrentAutoTask={setCurrentAutoTask}
                  promotions={availablePromos}
                  setAvailablePromos={setAvailablePromos}
                  completedTaskIds={completedTaskIds}
                  isAdmin={isAdmin}
                  recordTransaction={recordTransaction}
                  botLog={botLog}
                />
              </div>
            )}
            {activeTab === "get-subscribe" && (
              <GetSubscribeTab 
                profile={profile} 
                isAdmin={isAdmin} 
                recordTransaction={recordTransaction}
                campaignType={campaignType}
                setCampaignType={setCampaignType}
                youtubeUrl={youtubeUrl}
                setYoutubeUrl={setYoutubeUrl}
                subscriberCount={subscriberCount}
                setSubscriberCount={setSubscriberCount}
                channelLogo={channelLogo}
                setChannelLogo={setChannelLogo}
                metadata={metadata}
                setMetadata={setMetadata}
                isFetchingMetadata={isFetchingMetadata}
                setIsFetchingMetadata={setIsFetchingMetadata}
                addBotLog={addBotLog}
              />
            )}
            {activeTab === "admin" && isAdmin && (
              <div className="p-4 space-y-6">
                <AdminTab />
              </div>
            )}
        </div>
      </div>

      {/* FAQ Dialog */}
      <Dialog open={isFAQOpen} onOpenChange={setIsFAQOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <div className="bg-[#2196F3] p-6 text-white flex items-center justify-between">
            <DialogTitle className="text-xl font-black">Frequently Asked Questions</DialogTitle>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
            {[
              "How to earn coins fast?",
              "Why is my account limited?",
              "How to redeem gift codes?",
              "My coins are missing, what to do?",
              "I didn't receive my subscribers yet",
              "How to use Auto Engine?",
              "Why bot doesn't increase real subs?",
              "Where to find support?"
            ].map((q, i) => (
              <div key={i} className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100" onClick={() => {
                if (q === "Why bot doesn't increase real subs?") {
                  toast.info("Auto Engine is a simulation for earning coins internally. Real subscribers come from manual tasks by real users.", { duration: 5000 });
                }
              }}>
                <span className="text-sm font-bold text-slate-700">{q}</span>
                <ChevronRight className="h-4 w-4 text-blue-400" />
              </div>
            ))}
            <Button className="w-full bg-[#2196F3] hover:bg-blue-600 text-white rounded-2xl h-14 font-black mt-4 shadow-lg shadow-blue-600/20">
              <MessageSquare className="mr-2 h-6 w-6" />
              Contact Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Code Dialog */}
      <Dialog open={isGiftCodeOpen} onOpenChange={setIsGiftCodeOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <div className="bg-[#2196F3] p-8 text-white text-center">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black">Redeem Gift Code</DialogTitle>
            <p className="text-blue-100 text-sm mt-1">Get free coins daily!</p>
          </div>
          <div className="p-8 space-y-6">
            <p className="text-slate-500 text-center text-sm font-medium leading-relaxed">
              Enter the gift code from our Telegram channel to claim your free coins.
            </p>
            <Input 
              id="gift-code-input"
              placeholder="Enter code here..." 
              className="h-16 rounded-2xl border-slate-200 text-center font-black text-2xl uppercase tracking-[0.2em] focus:ring-[#2196F3]"
            />
            <div className="space-y-3">
              <Button 
                className="w-full bg-[#2196F3] hover:bg-blue-600 h-16 rounded-2xl font-black text-lg text-white shadow-lg shadow-blue-600/20"
                onClick={() => {
                  const input = document.querySelector('#gift-code-input') as HTMLInputElement;
                  if (input && input.value) {
                    handleClaimPromo(input.value);
                  }
                }}
              >
                Claim Coins
              </Button>
              <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 h-14 rounded-2xl font-bold">
                Get codes from Telegram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Friends Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-[32px] border-none shadow-2xl flex flex-col max-h-[90vh]">
          <div className="bg-pink-500 p-8 text-white text-center relative shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
              onClick={() => setIsInviteOpen(false)}
            >
              <Plus className="h-6 w-6 rotate-45" />
            </Button>
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black">Invite & Earn</DialogTitle>
            <p className="text-pink-100 mt-2">Get 50 coins + 10% lifetime commission!</p>
          </div>
          <div className="p-8 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referrals</p>
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 text-pink-500" />
                  <span className="text-xl font-black text-slate-800">{referralCount}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earnings</p>
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-xl font-black text-slate-800">{profile?.referralEarnings || 0}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Referral Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">REF-{profile?.uid?.slice(0, 6).toUpperCase()}</span>
                <Button size="icon" variant="ghost" className="text-pink-500" onClick={() => {
                  navigator.clipboard.writeText(`REF-${profile?.uid?.slice(0, 6).toUpperCase()}`);
                  toast.success("Code copied!");
                }}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">1</div>
                <span>Share your code with friends</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">2</div>
                <span>They enter it here</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">3</div>
                <span>Both of you get free coins!</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Enter Referral Code</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Code (e.g. REF-ABC123)" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 font-black text-sm"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  disabled={profile?.referredBy ? true : false}
                />
                <Button 
                  className="bg-pink-500 hover:bg-pink-600 h-12 rounded-xl font-black px-6"
                  onClick={handleReferralSubmit}
                  disabled={profile?.referredBy ? true : isClaimingReferral}
                >
                  {isClaimingReferral ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {profile?.referredBy && <p className="text-[10px] text-green-600 font-bold ml-1">✓ Referral applied!</p>}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Referral Link Below</p>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 h-14 rounded-2xl font-black text-lg text-white shadow-lg shadow-pink-600/20" onClick={() => {
                const link = `${window.location.origin}?ref=REF-${profile?.uid?.slice(0, 6).toUpperCase()}`;
                navigator.clipboard.writeText(link);
                toast.success("Referral link copied!");
              }}>
                Copy Referral Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-xs bg-white rounded-[32px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Settings className="h-6 w-6 text-slate-600" />
              Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800">Image Display</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Show thumbnails</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-[#2196F3]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800">Keep Screen On</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Prevent sleep</p>
              </div>
              <Switch className="data-[state=checked]:bg-[#2196F3]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800">Notifications</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Task alerts</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-[#2196F3]" />
            </div>
            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50" onClick={() => { setIsSettingsOpen(false); setShowTermsOfService(true); }}>
              <Info className="mr-2 h-4 w-4" />
              Terms and Conditions
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50" onClick={() => { setIsSettingsOpen(false); setShowPrivacyPolicy(true); }}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Privacy Policy
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => signOut(auth)}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accounts Dialog */}
      <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <DialogContent className="max-w-md bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8">
              <Badge className="bg-blue-600 text-white border-none font-black px-3 py-1 rounded-full">
                {connectedAccounts.length} {connectedAccounts.length === 1 ? 'Account' : 'Accounts'}
              </Badge>
            </div>
            <DialogTitle className="text-3xl font-black flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              Switch Account
            </DialogTitle>
            <p className="text-slate-400 font-medium mt-2">Tap an account to switch instantly</p>
          </div>
          
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Active Account */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Active Now</p>
              <div className="bg-blue-50 p-5 rounded-3xl border-2 border-blue-200 flex items-center gap-4 relative shadow-sm">
                <div className="absolute top-4 right-4">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50" />
                </div>
                <Avatar className="h-14 w-14 border-4 border-white shadow-md">
                  <AvatarImage src={profile?.photoURL} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-black">{profile?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-lg truncate">{profile?.displayName}</p>
                  <p className="text-xs font-bold text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="bg-white px-4 py-1.5 rounded-2xl shadow-sm border border-blue-100">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-black text-slate-800">{profile?.coins}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Accounts */}
            {connectedAccounts.length > 1 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Switch To</p>
                <div className="space-y-3">
                  {connectedAccounts.filter(a => a.uid !== user?.uid).map(acc => (
                    <div 
                      key={acc.uid} 
                      className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 relative group hover:border-blue-300 hover:bg-slate-50/50 transition-all cursor-pointer shadow-sm"
                      onClick={() => handleLogin(acc.email)}
                    >
                      <Avatar className="h-14 w-14 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage src={acc.photoURL} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-black">{acc.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-lg truncate">{acc.displayName}</p>
                        <p className="text-xs font-bold text-slate-400 truncate">{acc.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl">
                          <Coins className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="text-xs font-black text-slate-700">{acc.coins || 0}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAccount(acc.uid);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest px-3"
                          >
                            Switch
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full h-16 rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 font-black text-lg transition-all group"
              onClick={() => handleLogin()}
            >
              <Plus className="mr-2 h-6 w-6 group-hover:rotate-90 transition-transform" />
              Add New Account
            </Button>
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Coins: <span className="text-slate-900">{totalCoins}</span></p>
            </div>
            <Button variant="ghost" className="font-bold text-slate-500" onClick={() => setIsAccountsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advance Mode Dialog */}
      <Dialog open={isAdvanceModeOpen} onOpenChange={setIsAdvanceModeOpen}>
        <DialogContent className="max-w-md bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-yellow-500 p-6 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Zap className="h-6 w-6 fill-white" />
              Advance Mode
            </DialogTitle>
            <p className="text-yellow-100 text-sm mt-1">Unlock premium features for your campaigns</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Globe className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-slate-800">Target Country</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Worldwide</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white border-none text-[8px]">PRO</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Clock className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-slate-800">Schedule Posts</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Instant</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white border-none text-[8px]">PRO</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-xl text-green-600"><TrendingUp className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-slate-800">Priority Listing</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Standard</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white border-none text-[8px]">PRO</Badge>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 text-center">
              <h4 className="font-black text-blue-900 mb-2">Upgrade to Premium</h4>
              <p className="text-sm text-blue-600/70 mb-4">Get access to all advanced features and double your growth speed!</p>
              <Button className="w-full bg-[#2196F3] hover:bg-[#1976D2] h-12 rounded-xl font-black text-white shadow-lg shadow-blue-600/20">
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Transfer Coins Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 rounded-3xl max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Transfer Coins</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Recipient User ID</Label>
              <Input 
                placeholder="Enter User ID..." 
                className="bg-slate-50 border-slate-200 rounded-xl h-12 text-slate-900"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Amount</Label>
              <Input 
                type="number"
                placeholder="0" 
                className="bg-slate-50 border-slate-200 rounded-xl h-12 text-slate-900"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold text-white"
              onClick={handleTransfer}
              disabled={isTransferring}
            >
              {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Matching Screenshot */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center justify-around z-50 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton 
          active={activeTab === "home"} 
          icon={Home} 
          label="Home" 
          onClick={() => setActiveTab("home")} 
        />
        <NavButton 
          active={activeTab === "get-coin"} 
          icon={Zap} 
          label="Earn" 
          onClick={() => setActiveTab("get-coin")} 
        />
        <NavButton 
          active={activeTab === "get-subscribe"} 
          icon={Users} 
          label="Campaign" 
          onClick={() => setActiveTab("get-subscribe")} 
        />
        {isAdmin && (
          <NavButton 
            active={activeTab === "admin"} 
            icon={Shield} 
            label="Admin" 
            onClick={() => setActiveTab("admin")} 
          />
        )}
      </div>

      {/* Troubleshooting Dialog */}
      <Dialog open={isTroubleshootingOpen} onOpenChange={setIsTroubleshootingOpen}>
        <DialogContent className="max-w-md bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-blue-600 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <AlertCircle className="h-8 w-8" />
                Final Setup Guide
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 font-black text-xs">!</div>
                <div className="flex-1">
                  <p className="text-xs font-black text-red-600 uppercase">Step 0: Enable YouTube API</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed">
                    If you haven't yet, click this button and then click "ENABLE" on the Google page.
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50 h-10 text-[10px] font-black rounded-lg"
                    onClick={() => window.open('https://console.cloud.google.com/apis/library/youtube.googleapis.com?project=gen-lang-client-0716940414', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    ENABLE YOUTUBE API NOW
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-black text-xs">1</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Find the Checkbox (Visual Guide)</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    When you click Connect, you will see a Google screen. 
                    <span className="text-blue-600 font-black"> DO NOT JUST CLICK CONTINUE!</span>
                  </p>
                  
                  <div className="mt-3 bg-slate-100 p-4 rounded-xl border-2 border-dashed border-blue-200 space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Google Login Screen Looks Like This:</p>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-800">Select what [App Name] can access:</p>
                      <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                        <div className="h-4 w-4 border-2 border-blue-600 rounded bg-white flex items-center justify-center shrink-0 mt-0.5">
                          <div className="h-2 w-2 bg-blue-600 rounded-sm" />
                        </div>
                        <p className="text-[10px] font-black text-blue-700 leading-tight">
                          Manage your YouTube account<br/>
                          <span className="text-[8px] font-medium text-blue-500">View and manage your assets and...</span>
                        </p>
                      </div>
                      <p className="text-[8px] text-slate-400 mt-2 text-center italic">^ YOU MUST CHECK THIS BOX ^</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 font-bold mt-3">
                    If you don't see the box, look for a link that says <span className="text-blue-600">"See the services..."</span> or <span className="text-blue-600">"View more"</span> and click it!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-black text-xs">2</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Reset & Start Fresh</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    If you still don't see it, click the button below to clear everything and try again.
                  </p>
                  <Button 
                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white h-10 text-[10px] font-black rounded-lg"
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    RESET EVERYTHING & RESTART
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-black text-xs">3</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Test Your Connection</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    Click below to see if your YouTube account is correctly linked.
                  </p>
                  <Button 
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white h-10 text-[10px] font-black rounded-lg"
                    onClick={async () => {
                      const token = sessionStorage.getItem(`google_access_token_${auth.currentUser?.uid}`) || sessionStorage.getItem('google_access_token');
                      if (!token) {
                        toast.error("No connection found. Please connect first.");
                        return;
                      }
                      toast.loading("Verifying...", { id: "verify-yt" });
                      try {
                        const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (res.ok && data.items?.length > 0) {
                          toast.success("Verified! Connection is working.", { id: "verify-yt" });
                        } else {
                          toast.error(`Failed: ${data.error?.message || "Missing Permission"}`, { id: "verify-yt" });
                        }
                      } catch (e) {
                        toast.error("Network error during verification.", { id: "verify-yt" });
                      }
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    TEST CONNECTION NOW
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-black text-xs">4</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Use the "UC..." Channel ID</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    For the bot to work 100%, use your full Channel URL (like <span className="text-blue-600">youtube.com/channel/UC...</span>) instead of the @handle.
                  </p>
                  <Button 
                    variant="link"
                    className="p-0 h-auto text-[9px] font-black text-blue-500 uppercase"
                    onClick={() => window.open('https://www.youtube.com/account_advanced', '_blank')}
                  >
                    Find my UC ID here <ExternalLink className="h-2 w-2 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                <div className="h-6 w-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center shrink-0 font-black text-xs">!</div>
                <div>
                  <p className="text-xs font-black text-yellow-700 uppercase">Admin: Fix "Access Blocked"</p>
                  <p className="text-[10px] text-yellow-600 font-bold mt-1 leading-relaxed">
                    If new users see "Access Blocked", you must go to your <span className="font-black">Google Cloud Console</span> &gt; <span className="font-black">OAuth Consent Screen</span> and click <span className="text-blue-600 font-black">"PUBLISH APP"</span>. 
                    This moves your app from "Testing" to "Production" so anyone can log in.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project ID:</p>
              <code className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-bold text-blue-600">
                gen-lang-client-0716940414
              </code>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-black" onClick={() => setIsTroubleshootingOpen(false)}>
              Close Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Force Update Dialog */}
      <Dialog open={isUpdateRequired} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs bg-white rounded-[32px] p-8 border-none shadow-2xl text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Download className="h-10 w-10 text-blue-600 animate-bounce" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">Update Required</DialogTitle>
          <p className="text-slate-500 font-medium mt-4 leading-relaxed">
            A new version of NivaBoost is available with critical fixes and new features. 
            Please download the latest update to continue.
          </p>
          <Button 
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-black text-lg shadow-lg shadow-blue-600/20"
            onClick={() => window.location.reload()}
          >
            Update Now
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTab() {
  const [stats, setStats] = useState({ users: 0, activeUsers: 0, campaigns: 0, transfers: 0 });
  const [allPromos, setAllPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftCode, setGiftCode] = useState("");
  const [giftAmount, setGiftAmount] = useState(100);
  const [isCreatingGift, setIsCreatingGift] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const promosSnap = await getDocs(collection(db, "promotions"));
        const transfersSnap = await getDocs(collection(db, "transfers"));
        
        // Simulate active users (users who have some coins or just a random number for now)
        const activeCount = usersSnap.docs.filter(d => (d.data().coins || 0) > 100).length + 5; // +5 for simulation

        setStats({
          users: usersSnap.size,
          activeUsers: activeCount,
          campaigns: promosSnap.size,
          transfers: transfersSnap.size
        });
        
        setAllPromos(promosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "admin_stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const deletePromo = async (id: string) => {
    try {
      await updateDoc(doc(db, "promotions", id), { active: false });
      setAllPromos(prev => prev.map(p => p.id === id ? { ...p, active: false } : p));
      toast.success("Campaign deactivated");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `promotions/${id}`);
      toast.error("Failed to deactivate");
    }
  };

  const createGiftCode = async () => {
    if (!giftCode) return;
    setIsCreatingGift(true);
    try {
      await setDoc(doc(db, "gift_codes", giftCode.toUpperCase()), {
        code: giftCode.toUpperCase(),
        coins: giftAmount,
        usedBy: [],
        createdAt: serverTimestamp()
      });
      toast.success("Gift code created!");
      setGiftCode("");
    } catch (error) {
      toast.error("Failed to create code");
    } finally {
      setIsCreatingGift(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
          <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Users</p>
          <p className="text-lg font-black">{stats.users}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Active Now</p>
          <p className="text-lg font-black">{stats.activeUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
          <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Promos</p>
          <p className="text-lg font-black">{stats.campaigns}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
          <History className="h-5 w-5 mx-auto mb-1 text-indigo-600" />
          <p className="text-[10px] font-bold text-slate-400 uppercase">Transfers</p>
          <p className="text-lg font-black">{stats.transfers}</p>
        </div>
      </div>

      {/* Gift Code Creation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Gift className="h-5 w-5 text-green-600" />
          Create Gift Code
        </h3>
        <div className="space-y-3">
          <Input 
            placeholder="ENTER CODE (e.g. WELCOME100)" 
            value={giftCode} 
            onChange={(e) => setGiftCode(e.target.value)}
            className="h-12 font-black uppercase"
          />
          <Input 
            type="number" 
            placeholder="COIN AMOUNT" 
            value={giftAmount} 
            onChange={(e) => setGiftAmount(parseInt(e.target.value))}
            className="h-12 font-black"
          />
          <Button 
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl"
            onClick={createGiftCode}
            disabled={isCreatingGift}
          >
            {isCreatingGift ? <Loader2 className="animate-spin" /> : "CREATE GIFT CODE"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-lg">Active Campaigns</h3>
        {allPromos.filter(p => p.active).map(promo => (
          <Card key={promo.id} className="p-3 bg-white border-slate-200 rounded-xl shadow-sm">
            <div className="flex gap-3">
              <img src={promo.thumbnail} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{promo.title}</h4>
                <p className="text-xs text-slate-400">By: {promo.userName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px]">{promo.completedActions}/{promo.totalActions}</Badge>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deletePromo(promo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 relative group ${active ? "text-[#2196F3]" : "text-slate-400"} overflow-visible`}
    >
      <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? "bg-blue-50" : "group-hover:bg-slate-50"}`}>
        <div className="relative">
          {/* Motion lines effect */}
          {active && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-2 top-1 w-2 h-0.5 bg-blue-400 rounded-full opacity-80 animate-pulse" />
              <div className="absolute -left-3 top-3 w-3 h-0.5 bg-blue-300 rounded-full opacity-60 animate-pulse delay-75" />
              <div className="absolute -left-2 top-5 w-1.5 h-0.5 bg-blue-200 rounded-full opacity-40 animate-pulse delay-150" />
            </div>
          )}
          <Icon className={`h-7 w-7 ${active ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
        </div>
      </div>
      <span className={`text-[11px] font-black tracking-tight ${active ? "opacity-100" : "opacity-70"}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute -top-1 w-12 h-1 bg-[#2196F3] rounded-full"
        />
      )}
    </button>
  );
}

function BuyCoinsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const packages = [
    { name: "BRONZE", coins: "10000", price: "₹100.00", extra: "10% EXTRA", gradient: "from-[#2C3E50] to-[#000000]", textColor: "text-[#2C3E50]" },
    { name: "SILVER", coins: "20500", price: "₹200.00", extra: "10% EXTRA", gradient: "from-[#2ECC71] to-[#27AE60]", textColor: "text-[#2ECC71]" },
    { name: "GOLD", coins: "51000", price: "₹500.00", extra: "15% EXTRA", gradient: "from-[#F1C40F] to-[#F39C12]", textColor: "text-[#F39C12]" },
    { name: "DIMOND", coins: "103000", price: "₹1000.00", extra: "17% EXTRA", gradient: "from-[#9B59B6] to-[#8E44AD]", textColor: "text-[#8E44AD]" },
    { name: "PLATINUM", coins: "303000", price: "₹3000.00", extra: "25% EXTRA", gradient: "from-[#E67E22] to-[#D35400]", textColor: "text-[#D35400]" },
    { name: "PLATINUM PRO", coins: "520000", price: "₹5000.00", extra: "30% EXTRA", gradient: "from-[#3498DB] to-[#2980B9]", textColor: "text-[#2980B9]" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl h-[90vh] flex flex-col">
        <div className="p-8 text-center shrink-0">
          <DialogTitle className="text-4xl font-black text-slate-900">Buy Coins</DialogTitle>
          <p className="text-slate-400 font-medium mt-2">More coins, better value!</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="grid grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <motion.div
                key={pkg.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-xl p-4 bg-gradient-to-br ${pkg.gradient} flex flex-col items-center justify-center text-center shadow-xl overflow-hidden cursor-pointer aspect-square`}
                onClick={() => toast.info("Redirecting to secure payment...")}
              >
                {/* Extra Badge */}
                <div className="absolute top-0 right-0 bg-[#F1C40F] px-3 py-1 rounded-bl-2xl">
                  <span className="text-[10px] font-black text-slate-900">{pkg.extra}</span>
                </div>

                {/* Coins Icon */}
                <div className="bg-white/20 p-2 rounded-full mb-2 backdrop-blur-sm">
                  <div className="relative">
                    <div className="absolute inset-0 blur-sm bg-white/30 rounded-full" />
                    <Coins className="h-6 w-6 text-white relative z-10" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white leading-none">{pkg.coins}</h3>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1 mb-3">{pkg.name}</p>

                <Button className="w-full bg-white hover:bg-white/90 rounded-xl h-10 font-black text-sm shadow-lg border-none">
                  <span className={pkg.textColor}>{pkg.price}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Secure Payment via Razorpay</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HomeTab({ 
  profile, 
  user, 
  onLogout, 
  onOpenTransfer, 
  onOpenFAQ, 
  onOpenGiftCode, 
  onOpenInvite, 
  onOpenSettings, 
  onOpenAccounts, 
  onOpenTransactions,
  onOpenAdminPromo,
  onOpenSupport,
  onClaimDailyBonus,
  canClaimDaily,
  isAdmin,
  connectedAccounts
}: { 
  profile: UserProfile | null, 
  user: FirebaseUser | null, 
  onLogout: () => void, 
  onOpenTransfer: () => void, 
  onOpenFAQ: () => void,
  onOpenGiftCode: () => void,
  onOpenInvite: () => void,
  onOpenSettings: () => void,
  onOpenAccounts: () => void,
  onOpenTransactions: () => void,
  onOpenAdminPromo: () => void,
  onOpenSupport: () => void,
  onClaimDailyBonus: () => void,
  canClaimDaily: boolean,
  isAdmin: boolean,
  connectedAccounts: ConnectedAccount[]
}) {
  const [isBuyOpen, setIsBuyOpen] = useState(false);

  const menuItems = [
    { icon: Users, label: "Switch Account", color: "text-blue-600", bg: "bg-blue-50", onClick: onOpenAccounts, badge: connectedAccounts.length > 1 ? connectedAccounts.length : undefined },
    { icon: Gift, label: "Daily Bonus", color: "text-amber-600", bg: "bg-amber-50", onClick: onClaimDailyBonus, badge: canClaimDaily ? "CLAIM" : undefined },
    { icon: History, label: "Transaction History", color: "text-indigo-600", bg: "bg-indigo-50", onClick: onOpenTransactions },
    { icon: Gift, label: "Free Coins", color: "text-green-600", bg: "bg-green-50", onClick: onOpenGiftCode },
    { icon: ArrowRightLeft, label: "Transfer Coin", color: "text-purple-600", bg: "bg-purple-50", onClick: onOpenTransfer },
    { icon: UserPlus, label: "Invite Friends", color: "text-pink-600", bg: "bg-pink-50", onClick: onOpenInvite },
    { icon: HelpCircle, label: "Support (AI)", color: "text-orange-600", bg: "bg-orange-50", onClick: onOpenSupport },
    { icon: MessageSquare, label: "Join Telegram", color: "text-sky-600", bg: "bg-sky-50", onClick: () => window.open("https://t.me/nivaboost", "_blank") },
  ];

  return (
    <div className="space-y-6">
      <BuyCoinsDialog open={isBuyOpen} onOpenChange={setIsBuyOpen} />
      
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2196F3]" />
        <div className="relative mx-auto w-fit">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform" onClick={onOpenAccounts}>
            <AvatarImage src={profile?.photoURL} />
            <AvatarFallback className="text-2xl font-black bg-slate-100">{profile?.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div 
            className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-black h-7 w-7 rounded-full flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:bg-blue-700"
            onClick={onOpenAccounts}
          >
            {connectedAccounts.length > 1 ? connectedAccounts.length : <Plus className="h-3 w-3" />}
          </div>
        </div>
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <Button size="icon" variant="ghost" className="bg-slate-100 rounded-lg" onClick={onOpenSettings}><Settings className="h-5 w-5 text-slate-600" /></Button>
          <Button size="icon" variant="ghost" className="bg-slate-100 rounded-lg" onClick={onOpenAccounts}><Plus className="h-5 w-5 text-blue-600" /></Button>
          <Button size="icon" variant="ghost" className="bg-blue-100 rounded-lg" onClick={onOpenInvite}><Users className="h-5 w-5 text-blue-600" /></Button>
        </div>
        <h2 className="text-2xl font-black mt-4 text-slate-900">{profile?.displayName}</h2>
        <p className="text-slate-400 text-sm font-medium">{user?.email}</p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Coins</p>
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-lg font-black">{isAdmin ? "∞" : (profile?.coins || 0)}</span>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <Badge className="bg-green-500 text-white border-none h-5 text-[10px]">Active</Badge>
          </div>
        </div>

        <Button 
          className="w-full mt-6 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl h-14 font-black text-lg shadow-lg shadow-blue-600/20"
          onClick={() => setIsBuyOpen(true)}
        >
          <CreditCard className="mr-2 h-6 w-6" />
          Buy Coins
        </Button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 gap-3">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full h-16 bg-white border border-slate-100 rounded-xl justify-between px-6 hover:bg-slate-50 transition-all group shadow-sm"
            onClick={item.onClick}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="font-bold text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <Badge className="bg-blue-600 text-white border-none h-6 px-2 rounded-lg font-black text-[10px]">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </Button>
        ))}
        
        <Button 
          variant="ghost" 
          className="w-full h-16 bg-red-50 border border-red-100 rounded-xl justify-between px-6 hover:bg-red-100 transition-all group mt-4"
          onClick={onLogout}
        >
          <div className="flex items-center gap-4 text-red-600">
            <div className="p-2.5 rounded-xl bg-red-100 group-hover:scale-110 transition-transform">
              <LogOut className="h-6 w-6" />
            </div>
            <span className="font-bold">Logout Account</span>
          </div>
          <ChevronRight className="h-5 w-5 text-red-300 group-hover:text-red-500 transition-colors" />
        </Button>
      </div>
    </div>
  );
}

function GetCoinTab({ 
  profile, 
  filter, 
  setFilter,
  isAutoRunning,
  setIsAutoRunning,
  googleAccessToken,
  autoStats,
  isSearching,
  currentAutoTask,
  setCurrentAutoTask,
  promotions,
  setAvailablePromos,
  completedTaskIds,
  isAdmin,
  onConnectYouTube,
  recordTransaction,
  botLog
}: { 
  profile: UserProfile | null, 
  filter: string, 
  setFilter: (f: any) => void,
  isAutoRunning: boolean,
  setIsAutoRunning: (val: boolean) => void,
  googleAccessToken: string | null,
  onConnectYouTube: () => Promise<boolean>,
  autoStats: { tasksCompleted: number, coinsEarned: number },
  isSearching: boolean,
  currentAutoTask: Promotion | null,
  setCurrentAutoTask: (p: Promotion | null) => void,
  promotions: Promotion[],
  setAvailablePromos: React.Dispatch<React.SetStateAction<Promotion[]>>,
  completedTaskIds: Set<string>,
  isAdmin: boolean,
  recordTransaction: (userId: string, amount: number, type: Transaction['type'], description: string) => Promise<void>,
  botLog: string[]
}) {
  const currentPromo = isAutoRunning && currentAutoTask 
    ? currentAutoTask 
    : promotions.filter(p => !completedTaskIds.has(p.id)).filter(p => p.type === filter)[0];

  const [isBotWorking, setIsBotWorking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ok: boolean, msg: string} | null>(null);

  const verifyConnection = async () => {
    if (!googleAccessToken) return;
    setIsVerifying(true);
    try {
      const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      });
      const data = await res.json();
      if (res.ok && data.items?.length > 0) {
        setConnectionStatus({ ok: true, msg: "Connected & Verified!" });
      } else {
        setConnectionStatus({ ok: false, msg: data.error?.message || "Permission Missing" });
      }
    } catch (e) {
      setConnectionStatus({ ok: false, msg: "Network Error" });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) {
      verifyConnection();
    } else {
      setConnectionStatus(null);
    }
  }, [googleAccessToken]);

  useEffect(() => {
    if (isAutoRunning && currentAutoTask) {
      setIsBotWorking(true);
      const timer = setTimeout(() => setIsBotWorking(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [currentAutoTask, isAutoRunning]);

  const handleAction = async (promo: Promotion) => {
    const currentUid = auth.currentUser?.uid;
    if (!profile || !currentUid || currentUid !== profile.uid) {
      toast.error("Session error. Please refresh.");
      return;
    }

    // Ensure we have a connection
    if (!googleAccessToken) {
      const success = await onConnectYouTube();
      if (!success) return;
    }

    try {
      const actionRef = doc(db, "actions", `${currentUid}_${promo.id}`);
      let actionSnap;
      try {
        actionSnap = await getDoc(actionRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `actions/${currentUid}_${promo.id}`);
        return;
      }
      if (actionSnap.exists()) {
        toast.error("Task already completed!");
        setAvailablePromos(prev => prev.filter(p => p.id !== promo.id));
        return;
      }

      const batch = writeBatch(db);
      
      // 1. Create action
      batch.set(actionRef, { 
        userId: currentUid, 
        promotionId: promo.id, 
        timestamp: serverTimestamp() 
      });
      
      // 2. Add coins to user
      const userRef = doc(db, "users", currentUid);
      const reward = promo.type === 'subscribe' ? 4 : promo.coinsPerAction;
      batch.update(userRef, { 
        coins: increment(reward) 
      });
      
      // 3. Record transaction
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
        userId: currentUid,
        amount: reward,
        type: 'earn',
        description: `${promo.type} task`,
        timestamp: serverTimestamp()
      });

      // 4. Referral Commission (10%)
      if (profile.referredBy) {
        const referrerRef = doc(db, "users", profile.referredBy);
        const commission = Math.floor(reward * 0.1);
        if (commission > 0) {
          batch.update(referrerRef, {
            coins: increment(commission),
            referralEarnings: increment(commission)
          });
          const refTxRef = doc(collection(db, "transactions"));
          batch.set(refTxRef, {
            userId: profile.referredBy,
            amount: commission,
            type: 'referral',
            description: `Commission from ${profile.displayName}`,
            timestamp: serverTimestamp()
          });
        }
      }

      // 5. Update promotion
      const promoRef = doc(db, "promotions", promo.id);
      batch.update(promoRef, { 
        completedActions: increment(1) 
      });

      // 6. Real YouTube Action if connected
      if (googleAccessToken) {
        let actionSuccess = false;
        if (promo.type === 'subscribe') {
          const targetChannelId = promo.channelId || promo.targetId;
          if (targetChannelId.startsWith('UC')) {
            try {
              const res = await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${googleAccessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  snippet: {
                    resourceId: {
                      kind: 'youtube#channel',
                      channelId: targetChannelId
                    }
                  }
                })
              });
              
              if (res.ok) {
                toast.success("Subscribed on YouTube!", { id: "manual-yt-success" });
                actionSuccess = true;
              } else {
                const err = await res.json();
                console.error("Manual Sub Error:", err);
                if (err.error?.errors?.[0]?.reason === 'subscriptionDuplicate') {
                  actionSuccess = true; // Already subscribed is fine
                } else {
                  toast.error(`YouTube Error: ${err.error?.message || "Action failed"}`, { id: "yt-error" });
                }
              }
            } catch (e) {
              console.error("Manual Sub Fetch Error:", e);
            }
          }
        } else if (promo.type === 'like') {
          const targetVideoId = promo.videoId || promo.targetId;
          try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${targetVideoId}&rating=like`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${googleAccessToken}` }
            });
            if (res.ok) {
              toast.success("Liked on YouTube!", { id: "manual-yt-success" });
              actionSuccess = true;
            } else {
              const err = await res.json();
              console.error("Manual Like Error:", err);
              toast.error(`YouTube Error: ${err.error?.message || "Action failed"}`, { id: "yt-error" });
            }
          } catch (e) {
            console.error("Manual Like Fetch Error:", e);
          }
        }

        // If YouTube action failed, don't commit Firestore batch
        if (!actionSuccess) {
          console.log("[Manual] YouTube action failed, skipping Firestore update");
          return;
        }
      }

      await batch.commit();

      setAvailablePromos(prev => prev.filter(p => p.id !== promo.id));
      toast.success(`+${promo.coinsPerAction} Coins Earned!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `actions/${profile.uid}_${promo.id}`);
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-6 flex flex-col items-center">
      {/* Connection Status & Help */}
      <div className="w-full max-w-[360px] space-y-3">
        {googleAccessToken ? (
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between shadow-sm ${connectionStatus?.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${connectionStatus?.ok ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : connectionStatus?.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">YouTube Status</p>
                <p className={`text-xs font-black ${connectionStatus?.ok ? "text-green-700" : "text-red-700"}`}>
                  {isVerifying ? "Verifying..." : connectionStatus?.msg || "Checking..."}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 text-[10px] font-black uppercase tracking-tighter text-slate-500 hover:bg-white/50"
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Reset
            </Button>
          </div>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Setup Required</p>
                <p className="text-xs font-black text-blue-700 text-left">Connect YouTube to start earning</p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-[10px] font-black rounded-lg"
              onClick={onConnectYouTube}
            >
              Connect
            </Button>
          </div>
        )}
      </div>

      {/* Penalty Header */}
      <div className="w-full max-w-[360px] bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Penalty Header</span>
        </div>
        <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-lg">
          <span className="text-[10px] font-black text-white">-16 Coins</span>
        </div>
      </div>

      {/* Top Filters */}
      <div className="bg-white p-1 rounded-xl border border-slate-100 flex w-full shadow-sm">
        {(["subscribe", "like", "comment"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all capitalize ${filter === f ? "bg-[#2196F3] text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
          >
            {f === "subscribe" ? "Subscribers" : f}
          </button>
        ))}
      </div>

      {/* Main Task Area - YouTube Style */}
      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center p-0 relative overflow-hidden group">
        {currentPromo ? (
          <div className="w-full">
            {/* YouTube Header Style */}
            <div className="h-24 w-full bg-slate-100 relative">
              <img src={currentPromo.thumbnail} className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
            </div>
            
            <div className="px-8 pb-8 -mt-10 relative flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl mb-4">
                <AvatarImage src={currentPromo.userAvatar || currentPromo.thumbnail} />
                <AvatarFallback className="bg-red-600 text-white text-2xl font-black">YT</AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-black text-slate-900 line-clamp-1">{currentPromo.title}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">YouTube Channel</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reward</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-black text-slate-700">+{currentPromo.coinsPerAction}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Type</p>
                  <span className="font-black text-slate-700 capitalize">{filter === 'subscribe' ? 'Subscribe' : filter}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-14 rounded-xl font-bold text-slate-400 hover:bg-slate-50"
                  onClick={() => setAvailablePromos(prev => prev.filter(p => p.id !== currentPromo.id))}
                  disabled={isAutoRunning}
                >
                  Skip
                </Button>
                <Button 
                  className={`flex-[2] h-14 rounded-xl font-black text-lg shadow-xl transition-all group ${isAutoRunning ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"}`}
                  onClick={() => {
                    let url = "";
                    if (filter === 'subscribe') {
                      const target = currentPromo.channelId || currentPromo.targetId;
                      url = target.startsWith('UC') 
                        ? `https://www.youtube.com/channel/${target}`
                        : `https://www.youtube.com/${target.startsWith('@') ? target : '@' + target}`;
                    } else {
                      url = `https://www.youtube.com/watch?v=${currentPromo.videoId || currentPromo.targetId}`;
                    }
                    window.open(url, "_blank");
                    
                    // Only trigger manual action reward if auto-engine isn't already handling it
                    if (!isAutoRunning) {
                      setTimeout(() => handleAction(currentPromo), 2000);
                    }
                  }}
                >
                  {isAutoRunning ? (
                    <>
                      <Bot className={`mr-2 h-6 w-6 ${isBotWorking ? "animate-bounce" : ""}`} />
                      {isBotWorking ? "Bot Working..." : "Auto Engine ON"}
                    </>
                  ) : (
                    <>
                      <Youtube className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                      {filter === 'subscribe' ? 'Subscribe' : filter.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center text-center px-8">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Loader2 className="h-12 w-12 text-slate-200 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-400">No tasks available</h3>
            <p className="text-slate-300 font-bold text-sm mt-2">Check back later or try another filter</p>
          </div>
        )}
      </div>

      {/* Bottom Action Button - Matching Image 3 */}
      <div className="w-full max-w-[320px] space-y-4">
        {currentPromo && (
          <Button 
            className="w-full h-20 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl font-black text-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all active:scale-95"
            onClick={() => handleAction(currentPromo)}
          >
            <Plus className="h-8 w-8" />
            <span>+{currentPromo.coinsPerAction} Coins</span>
          </Button>
        )}

        {/* Auto Engine Toggle */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isAutoRunning ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                <Zap className={`h-5 w-5 ${isAutoRunning ? "animate-pulse" : ""}`} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-black text-sm text-slate-800">Auto Engine</p>
                  <button 
                    onClick={() => (window as any).openTroubleshooting()}
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isAutoRunning ? `Earned: ${autoStats.coinsEarned}` : "Off"}
                </p>
                <p className="text-[8px] text-red-500 font-black uppercase tracking-tighter mt-0.5">
                  * Unsubscribing = -2X Penalty
                </p>
                {googleAccessToken && (
                  <p className="text-[8px] text-blue-500 font-bold uppercase tracking-tighter mt-0.5">
                    * Real API Mode Active
                  </p>
                )}
              </div>
            </div>
          <Switch 
            checked={isAutoRunning} 
            onCheckedChange={async (val) => {
              if (val) {
                const success = await onConnectYouTube();
                if (success) {
                  setIsAutoRunning(true);
                }
              } else {
                setIsAutoRunning(false);
                setCurrentAutoTask(null);
              }
            }}
            className="data-[state=checked]:bg-[#2196F3]"
          />
        </div>

        {/* Setup Checklist - Only show if not connected or auto-running */}
        {!googleAccessToken && !isAutoRunning && (
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-5 mb-4 shadow-lg shadow-blue-500/10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest">🚀 Final Setup Guide</p>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 font-black text-xs">!</div>
                <div className="flex-1">
                  <p className="text-xs font-black text-red-600 uppercase">Step 0: Enable the API (Most Important)</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed">
                    If you don't see a checkbox, it's because the API is turned OFF.
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50 h-8 text-[10px] font-black rounded-lg"
                    onClick={() => window.open('https://console.cloud.google.com/apis/library/youtube.googleapis.com?project=gen-lang-client-0716940414', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    CLICK HERE TO ENABLE YOUTUBE API
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs">1</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Use the CORRECT Account</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    Log in with <span className="text-blue-600">tubefollowerhelp@gmail.com</span> or your 2nd Gmail.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs">2</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Find the "Hidden" Checkbox</p>
                  <div className="mt-2 space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      1. Click <span className="text-blue-600">"See the services..."</span>
                    </p>
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Visual Guide:</p>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-blue-600 rounded bg-white flex items-center justify-center">
                          <div className="h-2 w-2 bg-blue-600 rounded-sm" />
                        </div>
                        <p className="text-[10px] font-black text-slate-700">☑️ Manage your YouTube...</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      Look for the <span className="text-blue-600">Blue Square</span> to the left of the YouTube logo. You MUST click it!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs">3</div>
                <div>
                  <p className="text-xs font-black text-slate-800">Click Continue</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    Click the blue "Continue" button at the bottom.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black h-12 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                onClick={async () => {
                  sessionStorage.clear();
                  await onConnectYouTube();
                }}
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>RESET & START FRESH</span>
              </Button>
            </div>
            
            <p className="text-[9px] text-center text-slate-400 font-bold mt-3 uppercase tracking-tighter">
              * This will clear your session and start fresh
            </p>
          </div>
        )}

        {/* Bot Log Display */}
        {isAutoRunning && botLog.length > 0 && (
          <div className="bg-slate-900/5 p-3 rounded-xl border border-slate-100 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Bot Log</p>
            </div>
            <div className="space-y-1">
              {botLog.map((log, i) => (
                <p key={i} className={`text-[10px] font-bold ${i === 0 ? "text-blue-600" : "text-slate-400"}`}>
                  {i === 0 ? "> " : "  "}{log}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GetSubscribeTab({ 
  profile, 
  isAdmin, 
  recordTransaction,
  campaignType,
  setCampaignType,
  youtubeUrl,
  setYoutubeUrl,
  subscriberCount,
  setSubscriberCount,
  channelLogo,
  setChannelLogo,
  metadata,
  setMetadata,
  isFetchingMetadata,
  setIsFetchingMetadata,
  addBotLog
}: { 
  profile: UserProfile | null, 
  isAdmin: boolean,
  recordTransaction: (userId: string, amount: number, type: Transaction['type'], description: string) => Promise<void>,
  campaignType: "subscribe" | "like" | "comment",
  setCampaignType: (t: "subscribe" | "like" | "comment") => void,
  youtubeUrl: string,
  setYoutubeUrl: (url: string) => void,
  subscriberCount: number,
  setSubscriberCount: (count: number) => void,
  channelLogo: string | null,
  setChannelLogo: (logo: string | null) => void,
  metadata: { title: string, thumbnail: string } | null,
  setMetadata: (m: { title: string, thumbnail: string } | null) => void,
  isFetchingMetadata: boolean,
  setIsFetchingMetadata: (b: boolean) => void,
  addBotLog: (msg: string) => void
}) {
  const [myPromos, setMyPromos] = useState<Promotion[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!youtubeUrl.trim()) {
      setUrlError(null);
      return;
    }
    if (campaignType === "subscribe") {
      const channelMatch = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/|@)([a-zA-Z0-9_-]+)/) || 
                          youtubeUrl.match(/^@([a-zA-Z0-9_-]+)$/) ||
                          youtubeUrl.match(/^(UC[a-zA-Z0-9_-]{22})$/);
      if (!channelMatch) {
        setUrlError("Invalid Channel URL, @handle or UC ID");
      } else {
        setUrlError(null);
      }
    } else if (campaignType === "like") {
      const videoMatch = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) || 
                        youtubeUrl.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
                        youtubeUrl.match(/^([a-zA-Z0-9_-]{11})$/);
      if (!videoMatch) {
        setUrlError("Invalid Video URL or ID");
      } else {
        setUrlError(null);
      }
    } else {
      setUrlError(null);
    }
  }, [youtubeUrl, campaignType]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "promotions"), where("userId", "==", profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMyPromos(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Promotion)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "promotions_my");
    });
    return unsubscribe;
  }, [profile?.uid]);

  const handleCreate = async (count: number, totalCost: number) => {
    if (!profile || !youtubeUrl) {
      toast.error(`Please enter a YouTube ${campaignType === 'subscribe' ? 'Channel' : 'Video'} URL first`);
      return;
    }

    // If metadata is already fetched, use it. Otherwise, proceed to runVerification.
    if (urlError) {
      toast.error(urlError);
      return;
    }
    
    if (!isAdmin && profile.coins < totalCost) {
      toast.error("Insufficient coins!");
      return;
    }

    setIsVerifying(true);
    try {
      let targetId = "";
      if (campaignType === "subscribe") {
        const channelMatch = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/|@)([a-zA-Z0-9_-]+)/) || 
                            youtubeUrl.match(/^@([a-zA-Z0-9_-]+)$/) ||
                            youtubeUrl.match(/^(UC[a-zA-Z0-9_-]{22})$/);
        if (!channelMatch) {
          toast.error("Please enter a valid YouTube Channel URL, @handle or UC ID");
          setIsVerifying(false);
          return;
        }
        targetId = channelMatch[1];
      } else {
        const videoMatch = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) || 
                          youtubeUrl.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
                          youtubeUrl.match(/^([a-zA-Z0-9_-]{11})$/);
        if (!videoMatch) {
          toast.error("Please enter a valid YouTube Video URL or ID");
          setIsVerifying(false);
          return;
        }
        targetId = videoMatch[1];
      }

      // Use pre-fetched metadata if available for "Fast AI Verification"
      let title = metadata?.title || (campaignType === "subscribe" ? "YouTube Channel" : "YouTube Video");
      let thumbnail = metadata?.thumbnail || channelLogo || profile.photoURL;
      let finalChannelId = (metadata as any)?.channelId;
      let finalVideoId = (metadata as any)?.videoId;

      // Clean IDs if they are present in metadata
      if (finalChannelId) {
        const ucMatch = finalChannelId.match(/UC[a-zA-Z0-9_-]{22}/);
        if (ucMatch) finalChannelId = ucMatch[0];
      }
      if (finalVideoId) {
        const vMatch = finalVideoId.match(/[a-zA-Z0-9_-]{11}/);
        if (vMatch) finalVideoId = vMatch[0];
      }

      if (!metadata) {
        // Fallback to quick verification if metadata not yet fetched
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const runVerification = async (useSearch = false): Promise<any> => {
          const config: any = { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          };
          if (useSearch) config.tools = [{ googleSearch: {} }];

          const verification = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Verify YouTube ${campaignType}: ${targetId}. 
            Return ONLY JSON: {
              "valid": true,
              "title": "string",
              "thumbnail": "string",
              "channelId": "string (MUST be the 24-char UC... ID)",
              "videoId": "string (MUST be the 11-char video ID)"
            }`,
            config
          });
          
          let verificationText = "";
          if (verification.text) {
            verificationText = verification.text;
          } else if (verification.candidates?.[0]?.content?.parts) {
            verificationText = verification.candidates[0].content.parts
              .map(part => part.text || "")
              .join(" ")
              .trim();
          }

          if (!verificationText && !useSearch) {
            console.warn("[Verify] Empty response without search, retrying with search...");
            return runVerification(true);
          }
          return verificationText;
        };

        const verificationText = await runVerification();
        
        if (!verificationText) {
          toast.error("Verification failed. Please try again.");
          setIsVerifying(false);
          return;
        }

        let result;
        try {
          result = JSON.parse(verificationText.replace(/```json/g, "").replace(/```/g, "").trim());
        } catch (e) {
          console.error("Failed to parse verification JSON:", e);
          toast.error("Verification error. Please try again.");
          setIsVerifying(false);
          return;
        }
        
        if (!result || !result.valid) {
          toast.error("Could not verify YouTube link");
          setIsVerifying(false);
          return;
        }

      // Ensure we have a channelId for subscriptions
      if (campaignType === "subscribe") {
        const isUC = (id: string) => id && id.startsWith('UC') && id.length === 24;
        
        if (!isUC(finalChannelId)) {
          addBotLog("Resolving UC ID for campaign...");
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const repair = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Find the YouTube Channel ID (MUST start with UC and be 24 chars) for this handle or URL: ${youtubeUrl}. Return ONLY the 24-character UC... ID.`,
              config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            });
            const repairedId = repair.text?.trim().match(/UC[a-zA-Z0-9_-]{22}/)?.[0];
            if (isUC(repairedId)) {
              finalChannelId = repairedId;
            } else {
              toast.error("Could not find your Channel ID (UC...). Please use your full Channel URL from your browser address bar.", { duration: 6000 });
              setIsVerifying(false);
              return;
            }
          } catch (e) {
            toast.error("ID Resolution failed. Please use a full Channel URL.");
            setIsVerifying(false);
            return;
          }
        }
      }

      title = result?.title || title;
        thumbnail = result.thumbnail || thumbnail;
        
        // Clean IDs using regex
        if (result.channelId) {
          const ucMatch = result.channelId.match(/UC[a-zA-Z0-9_-]{22}/);
          finalChannelId = ucMatch ? ucMatch[0] : result.channelId;
        }
        if (result.videoId) {
          const vMatch = result.videoId.match(/[a-zA-Z0-9_-]{11}/);
          finalVideoId = vMatch ? vMatch[0] : result.videoId;
        }
        
        // Update local metadata if it was missing
        if (!metadata) {
          (setMetadata as any)({
            title: title,
            thumbnail: thumbnail,
            channelId: finalChannelId,
            videoId: finalVideoId
          });
        }
      }

      const promoData: any = {
        userId: profile.uid,
        userName: profile.displayName,
        userAvatar: profile.photoURL,
        type: campaignType,
        targetId,
        channelId: finalChannelId || null,
        videoId: finalVideoId || null,
        title: title,
        thumbnail: thumbnail,
        coinsPerAction: totalCost / count,
        totalActions: count,
        completedActions: 0,
        active: true,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "promotions"), promoData);

      if (!isAdmin) {
        await updateDoc(doc(db, "users", profile.uid), {
          coins: increment(-totalCost)
        });
        await recordTransaction(profile.uid, totalCost, 'spend', `Created ${campaignType} campaign`);
      }

      toast.success("Campaign launched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create campaign");
    } finally {
      setIsVerifying(false);
    }
  };

  const cancelCampaign = async (promo: Promotion) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, "promotions", promo.id), { active: false });
      const remaining = promo.totalActions - promo.completedActions;
      if (remaining > 0) {
        const refund = remaining * promo.coinsPerAction;
        await updateDoc(doc(db, "users", profile.uid), { coins: increment(refund) });
        await recordTransaction(profile.uid, refund, 'earn', `Refund from cancelled campaign`);
        toast.success(`Campaign cancelled. Refunded ${refund} coins.`);
      } else {
        toast.success("Campaign completed and closed.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `promotions/${promo.id}`);
      toast.error("Failed to cancel campaign");
    }
  };

  const packages = [
    { count: 20, price: campaignType === "subscribe" ? 160 : 80 },
    { count: 50, price: campaignType === "subscribe" ? 400 : 200 },
    { count: 75, price: campaignType === "subscribe" ? 600 : 300 },
    { count: 100, price: campaignType === "subscribe" ? 800 : 400 },
    { count: 200, price: campaignType === "subscribe" ? 1600 : 800 },
    { count: 300, price: campaignType === "subscribe" ? 2400 : 1200 },
    { count: 400, price: campaignType === "subscribe" ? 3200 : 1600 },
    { count: 500, price: campaignType === "subscribe" ? 4000 : 2000 },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Blue Header Section - Matching Image */}
      <div className="bg-[#2196F3] p-4 sm:p-6 pb-10 sm:pb-12 rounded-b-2xl sm:rounded-b-3xl space-y-4 sm:space-y-6 shadow-lg shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl sm:rounded-2xl backdrop-blur-md">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Campaign</h1>
          </div>
          <button className="bg-white/20 p-2 rounded-xl sm:rounded-2xl backdrop-blur-md text-white">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 shadow-xl">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-blue-50 overflow-hidden shrink-0">
              {isFetchingMetadata ? (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600" />
                </div>
              ) : channelLogo ? (
                <AvatarImage src={channelLogo} />
              ) : youtubeUrl ? (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
              ) : (
                <AvatarImage src={profile?.photoURL} />
              )}
              <AvatarFallback>{profile?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Input 
                placeholder={campaignType === "subscribe" ? "Add Channel URL..." : "Add Video URL..."} 
                className="border-none bg-transparent h-8 p-0 font-black text-sm sm:text-base text-slate-800 placeholder:text-slate-300 focus-visible:ring-0"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              {urlError && (
                <p className="text-[10px] text-red-500 font-bold mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {urlError}
                </p>
              )}
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 border border-white/30 shadow-xl sm:min-w-[100px] justify-center">
            <div className="bg-blue-500 p-1 rounded-lg">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="text-white font-black text-base sm:text-lg truncate">
              {isFetchingMetadata ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : subscriberCount > 0 ? (
                subscriberCount.toLocaleString()
              ) : (
                "0"
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 sm:-mt-7 space-y-5 sm:space-y-6 pb-32">
        {/* Tab Selection */}
        <div className="bg-white p-1 rounded-xl flex shadow-xl border border-slate-100">
          {(["subscribe", "like", "comment"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setCampaignType(t);
              }}
              className={`flex-1 py-2.5 sm:py-3.5 rounded-lg font-black text-[10px] sm:text-xs transition-all ${campaignType === t ? "bg-blue-50 text-[#2196F3]" : "text-slate-400 hover:text-slate-600"}`}
            >
              {t === "subscribe" ? "Subscribers" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
            </button>
          ))}
        </div>

        {/* Package List */}
        <div className="space-y-2.5 sm:space-y-3">
          {packages.map((pkg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-blue-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-[#2196F3] group-hover:bg-blue-100 transition-colors">
                  {campaignType === "subscribe" ? <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" /> : campaignType === "like" ? <Heart className="h-5 w-5 sm:h-6 sm:w-6" /> : <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-black text-slate-900">{pkg.count}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {campaignType === "subscribe" ? "Subscribers" : campaignType.charAt(0).toUpperCase() + campaignType.slice(1) + "s"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-yellow-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-yellow-100">
                  <div className="bg-yellow-400 rounded-full p-0.5">
                    <Coins className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                  </div>
                  <span className="font-black text-xs sm:text-sm text-yellow-700">{pkg.price}</span>
                </div>

                <Button 
                  variant="outline"
                  className="border-2 border-yellow-400 text-yellow-600 font-black rounded-lg sm:rounded-xl px-4 sm:px-6 hover:bg-yellow-400 hover:text-white transition-all h-8 sm:h-10 text-xs sm:text-sm"
                  onClick={() => handleCreate(pkg.count, pkg.price)}
                  disabled={isVerifying || isFetchingMetadata}
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active Campaigns Section */}
        {myPromos.filter(p => p.active).length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-black text-slate-900 ml-1">Active Campaigns</h2>
            <div className="grid gap-3">
              {myPromos.filter(p => p.active).map((promo) => (
                <Card key={promo.id} className="bg-white border-slate-100 p-3 sm:p-4 rounded-[20px] sm:rounded-[24px] shadow-sm group">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 shadow-md">
                      <img src={promo.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs sm:text-sm truncate text-slate-900">{promo.title}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-[#2196F3] bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                          <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{promo.completedActions} / {promo.totalActions}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-yellow-600 bg-yellow-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                          <Coins className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{promo.coinsPerAction}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl h-8 w-8 sm:h-10 sm:w-10"
                      onClick={() => {
                        if (isAdmin) {
                          cancelCampaign(promo);
                        } else {
                          toast.error("Only admins can delete campaigns.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- End of App ---
