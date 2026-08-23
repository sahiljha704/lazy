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
