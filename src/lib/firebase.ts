import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { UIComponentItem, UserSession } from '../types';
import { SEED_COMPONENTS } from '../data/seedComponents';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Firebase configuration from provisioned file
const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || 'gen-lang-client-0583816397',
  appId: firebaseConfigJson.appId || '1:151092516504:web:8f105172f2f121e9c722ed',
  apiKey: firebaseConfigJson.apiKey || 'AIzaSyD76PS9NB8UxprhVdLbi1g6RZe5xYXoSyE',
  authDomain: firebaseConfigJson.authDomain || 'gen-lang-client-0583816397.firebaseapp.com',
  storageBucket: firebaseConfigJson.storageBucket || 'gen-lang-client-0583816397.firebasestorage.app',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '151092516504',
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Named or default database
export const db: Firestore = (firebaseConfigJson as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfigJson as any).firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ================= FIRESTORE DATABASE HELPERS =================

/**
 * Sync or create user in Firestore
 */
export async function syncUserInFirestore(user: UserSession): Promise<UserSession> {
  try {
    const cleanEmail = user.email.toLowerCase().trim();
    const userRef = doc(db, 'users', cleanEmail);
    const snap = await getDoc(userRef);

    const now = new Date().toISOString();

    if (!snap.exists()) {
      const newUserRecord = {
        email: cleanEmail,
        name: user.name || cleanEmail.split('@')[0],
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}&backgroundColor=09090b`,
        joinedAt: now,
        lastLoginAt: now,
        copiedTodayCount: 0,
        unlockedComponentIds: [],
        wishlistComponentIds: [],
        likedComponentIds: [],
      };
      await setDoc(userRef, newUserRecord);

      return {
        ...user,
        name: newUserRecord.name,
        avatar: newUserRecord.avatar,
        joinedAt: newUserRecord.joinedAt,
        copiedTodayCount: 0,
        unlockedComponentIds: [],
        wishlistComponentIds: [],
        likedComponentIds: [],
        isFirstLogin: true,
      };
    } else {
      const data = snap.data();
      const currentAvatar = data.avatar || user.avatar;

      await updateDoc(userRef, {
        lastLoginAt: now,
        name: user.name || data.name,
        avatar: currentAvatar,
      });

      return {
        ...user,
        name: user.name || data.name,
        avatar: currentAvatar,
        joinedAt: data.joinedAt || user.joinedAt,
        copiedTodayCount: data.copiedTodayCount ?? user.copiedTodayCount ?? 0,
        unlockedComponentIds: data.unlockedComponentIds || user.unlockedComponentIds || [],
        wishlistComponentIds: data.wishlistComponentIds || user.wishlistComponentIds || [],
        likedComponentIds: data.likedComponentIds || user.likedComponentIds || [],
        isFirstLogin: false,
      };
    }
  } catch (err) {
    console.warn('Firestore sync failed, using client session:', err);
    return user;
  }
}

/**
 * Real Google Authentication with Firebase Auth
 */
export async function signInWithGoogleReal(): Promise<UserSession> {
  try {
    // Try popup first
    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (popupError: any) {
      // If popup is blocked or fails, try redirect
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/cancelled-popup-request' ||
        popupError.code === 'auth/popup-closed-by-user'
      ) {
        // Fall back to redirect
        await signInWithRedirect(auth, googleProvider);
        // This line won't execute immediately; the page will redirect
        throw new Error('Redirecting to Google Sign-In...');
      }
      throw popupError;
    }

    const gUser = result.user;
    const email = gUser.email || '';

    if (!email) {
      throw new Error('No email returned from Google authentication.');
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      await signOut(auth);
      throw new Error('Access denied: Only Google @gmail.com accounts are permitted to authenticate.');
    }

    const session: UserSession = {
      email: email.toLowerCase(),
      name: gUser.displayName || email.split('@')[0],
      avatar: gUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}&backgroundColor=09090b`,
      joinedAt: new Date().toISOString(),
      copiedTodayCount: 0,
      unlockedComponentIds: [],
      wishlistComponentIds: [],
      likedComponentIds: [],
    };

    return await syncUserInFirestore(session);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups and try again.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google Sign-In was cancelled.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for Google Sign-In. Please use the Gmail/password login below.');
    }
    throw error;
  }
}

/**
 * Handle redirect result after Google Sign-In redirect
 */
export async function handleGoogleRedirectResult(): Promise<UserSession | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const gUser = result.user;
    const email = gUser.email || '';

    if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
      await signOut(auth);
      return null;
    }

    const session: UserSession = {
      email: email.toLowerCase(),
      name: gUser.displayName || email.split('@')[0],
      avatar: gUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}&backgroundColor=09090b`,
      joinedAt: new Date().toISOString(),
      copiedTodayCount: 0,
      unlockedComponentIds: [],
      wishlistComponentIds: [],
      likedComponentIds: [],
    };

    return await syncUserInFirestore(session);
  } catch (err) {
    console.warn('Google redirect result check failed:', err);
    return null;
  }
}

/**
 * Update User Avatar in Firestore
 */
export async function updateUserAvatarInFirestore(userEmail: string, newAvatarUrl: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userEmail.toLowerCase().trim());
    await updateDoc(userRef, {
      avatar: newAvatarUrl,
    });
  } catch (err) {
    console.warn('Failed to update avatar in Firestore:', err);
  }
}

/**
 * Fetch all components from Firestore, or initialize seed components if empty
 */
export async function fetchComponentsFromFirestore(): Promise<UIComponentItem[]> {
  try {
    const compCol = collection(db, 'components');
    const snap = await getDocs(compCol);

    if (snap.empty) {
      // Seed initial components into Firestore
      for (const comp of SEED_COMPONENTS) {
        await setDoc(doc(db, 'components', comp.id), comp);
      }
      return SEED_COMPONENTS;
    }

    const items: UIComponentItem[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as UIComponentItem);
    });

    // Sort by newest
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.warn('Firestore fetch failed, returning seed fallback:', err);
    return SEED_COMPONENTS;
  }
}

/**
 * Publish a new component to Firestore
 */
export async function publishComponentToFirestore(comp: UIComponentItem): Promise<void> {
  try {
    const compRef = doc(db, 'components', comp.id);
    await setDoc(compRef, comp);
  } catch (err) {
    console.warn('Firestore publish error:', err);
  }
}

/**
 * Toggle like in Firestore
 */
export async function toggleLikeInFirestore(compId: string, userEmail: string, isLiked: boolean): Promise<void> {
  try {
    const compRef = doc(db, 'components', compId);
    const userRef = doc(db, 'users', userEmail.toLowerCase());

    await updateDoc(compRef, {
      likesCount: increment(isLiked ? 1 : -1),
    });

    if (isLiked) {
      await updateDoc(userRef, {
        likedComponentIds: arrayUnion(compId),
      });
    } else {
      await updateDoc(userRef, {
        likedComponentIds: arrayRemove(compId),
      });
    }
  } catch (err) {
    console.warn('Firestore toggle like error:', err);
  }
}

/**
 * Toggle wishlist in Firestore
 */
export async function toggleWishlistInFirestore(compId: string, userEmail: string, isWishlisted: boolean): Promise<void> {
  try {
    const compRef = doc(db, 'components', compId);
    const userRef = doc(db, 'users', userEmail.toLowerCase());

    await updateDoc(compRef, {
      wishlistCount: increment(isWishlisted ? 1 : -1),
    });

    if (isWishlisted) {
      await updateDoc(userRef, {
        wishlistComponentIds: arrayUnion(compId),
      });
    } else {
      await updateDoc(userRef, {
        wishlistComponentIds: arrayRemove(compId),
      });
    }
  } catch (err) {
    console.warn('Firestore toggle wishlist error:', err);
  }
}

/**
 * Listen to real-time auth changes from Firebase Auth
 */
export function subscribeToFirebaseAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Delete a component from Firestore
 */
export async function deleteComponentFromFirestore(compId: string): Promise<void> {
  try {
    const compRef = doc(db, 'components', compId);
    await deleteDoc(compRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}

/**
 * Log out from Firebase Auth
 */
export async function logOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut warning:', err);
  }
}
