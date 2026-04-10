import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

import { initializeFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to bypass potential network issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
// Removed mandatory youtube.force-subscribe scope to prevent "Access blocked" errors during initial login.
// Scopes will be requested on-demand when using the Auto Engine.
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, currentUser?: any) {
  const user = currentUser || auth.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    // Try to get a document from the server to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.warn("Firestore is unreachable. This usually means the database needs to be set up or re-provisioned via the Firebase Setup UI.");
      // We can't fix this in code, it requires the set_up_firebase tool.
    } else if (error.code === 'permission-denied') {
      // This is actually good, it means we connected but were denied access (expected for test/connection)
      console.log("Firestore connection verified (permission denied as expected).");
    } else {
      console.error("Firestore connection test failed:", error);
    }
  }
}
testConnection();
