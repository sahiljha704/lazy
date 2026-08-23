import { UIComponentItem, UserSession, CopyQuotaResponse } from '../types';
import { SEED_COMPONENTS } from '../data/seedComponents';
import {
  syncUserInFirestore,
  signInWithGoogleReal,
  fetchComponentsFromFirestore,
  publishComponentToFirestore,
  deleteComponentFromFirestore,
  toggleLikeInFirestore,
  toggleWishlistInFirestore,
  updateUserAvatarInFirestore,
} from '../lib/firebase';

const LOCAL_STORAGE_USER_KEY = 'lazy_ui_user_session';
const LOCAL_STORAGE_SIDEBAR_KEY = 'lazy_ui_sidebar_collapsed';
const LOCAL_STORAGE_UPLOADED_COMPONENTS_KEY = 'lazy_ui_uploaded_components_cache';

export function getStoredUploadedComponents(): UIComponentItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_UPLOADED_COMPONENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredUploadedComponents(components: UIComponentItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_UPLOADED_COMPONENTS_KEY, JSON.stringify(components));
  } catch (e) {}
}

export function addStoredUploadedComponent(component: UIComponentItem) {
  try {
    const current = getStoredUploadedComponents();
    const filtered = current.filter((c) => c.id !== component.id);
    filtered.unshift(component);
    saveStoredUploadedComponents(filtered);
  } catch (e) {}
}

export function removeStoredUploadedComponent(id: string) {
  try {
    const current = getStoredUploadedComponents();
    const filtered = current.filter((c) => c.id !== id);
    saveStoredUploadedComponents(filtered);
  } catch (e) {}
}

export function getStoredUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user.email && user.email.toLowerCase().endsWith('@gmail.com')) {
      return user;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function saveStoredUser(user: UserSession | null) {
  if (!user) {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  }
}

export function getStoredSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_SIDEBAR_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function saveStoredSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SIDEBAR_KEY, collapsed ? 'true' : 'false');
  } catch (e) {}
}

export async function loginWithGmail(
  email: string,
  password: string,
  name?: string,
  avatar?: string
): Promise<{ user: UserSession; quota: CopyQuotaResponse; isFirstLogin?: boolean }> {
  if (!email || !email.trim().toLowerCase().endsWith('@gmail.com')) {
    throw new Error('Access denied: Only official @gmail.com accounts are permitted to authenticate on Lazy UI.');
  }

  if (!password || password.length < 4) {
    throw new Error('Please enter a password with at least 4 characters.');
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim(), name, avatar }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to authenticate Gmail account.');
  }

  const data = await res.json();

  // Sync with Firestore cloud database
  try {
    const syncedUser = await syncUserInFirestore(data.user);
    data.user = syncedUser;
  } catch (err) {
    console.warn('Firestore user sync warning:', err);
  }

  saveStoredUser(data.user);
  return data;
}

export async function loginWithGoogle(): Promise<{ user: UserSession }> {
  const user = await signInWithGoogleReal();
  saveStoredUser(user);
  return { user };
}

export async function updateUserAvatar(email: string, avatarUrl: string): Promise<UserSession> {
  const current = getStoredUser();
  const updated: UserSession = {
    ...(current || {
      email,
      name: email.split('@')[0],
      joinedAt: new Date().toISOString(),
      copiedTodayCount: 0,
      unlockedComponentIds: [],
      wishlistComponentIds: [],
      likedComponentIds: [],
    }),
    avatar: avatarUrl,
  };

  saveStoredUser(updated);

  // Sync to Firestore
  updateUserAvatarInFirestore(email, avatarUrl).catch((err) => {
    console.warn('Firestore avatar update warning:', err);
  });

  // Sync to backend
  fetch('/api/auth/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, avatar: avatarUrl }),
  }).catch(() => {});

  return updated;
}

export async function fetchComponents(params?: {
  category?: string;
  search?: string;
  framework?: string;
  sort?: string;
  email?: string;
}): Promise<UIComponentItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.framework && params.framework !== 'All') query.set('framework', params.framework);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.email) query.set('email', params.email);

  const localCachedUploads = getStoredUploadedComponents();

  try {
    const res = await fetch(`/api/components?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.components)) {
        // Merge with local cached uploads if any are missing
        const serverList: UIComponentItem[] = data.components;
        const serverIds = new Set(serverList.map((c) => c.id));
        const missingLocal = localCachedUploads.filter((c) => !serverIds.has(c.id));
        return [...missingLocal, ...serverList];
      }
    }
  } catch (e) {
    // Fallback to Firestore or Local Cache
  }

  try {
    const fromFirestore = await fetchComponentsFromFirestore();
    if (fromFirestore && fromFirestore.length > 0) {
      const fsIds = new Set(fromFirestore.map((c) => c.id));
      const missingLocal = localCachedUploads.filter((c) => !fsIds.has(c.id));
      return [...missingLocal, ...fromFirestore];
    }
    return [...localCachedUploads, ...SEED_COMPONENTS];
  } catch (err) {
    return [...localCachedUploads, ...SEED_COMPONENTS];
  }
}

export async function fetchComponentById(id: string, email?: string): Promise<UIComponentItem | null> {
  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`/api/components/${id}${query}`);
    if (res.ok) {
      const data = await res.json();
      return data.component;
    }
  } catch (e) {}

  const cached = getStoredUploadedComponents().find((c) => c.id === id);
  if (cached) return cached;

  const found = SEED_COMPONENTS.find((c) => c.id === id);
  return found || null;
}

export async function recordComponentView(id: string): Promise<number | null> {
  try {
    let viewerId = localStorage.getItem('lazy_ui_viewer_id');
    if (!viewerId) {
      viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('lazy_ui_viewer_id', viewerId);
    }

    const sessionKey = `viewed_comp_${id}`;
    if (sessionStorage.getItem(sessionKey)) {
      // Already counted in this session
      return null;
    }
    sessionStorage.setItem(sessionKey, '1');

    const res = await fetch(`/api/components/${id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewerId }),
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.viewsCount === 'number' ? data.viewsCount : null;
    }
  } catch (e) {}

  return null;
}

export async function toggleLikeComponent(id: string, email: string): Promise<{ isLiked: boolean; likesCount: number }> {
  try {
    const res = await fetch(`/api/components/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const data = await res.json();
      toggleLikeInFirestore(id, email, data.isLiked).catch(() => {});
      return data;
    }
  } catch (e) {}

  // Fallback
  return { isLiked: true, likesCount: 1 };
}

export async function toggleWishlistComponent(id: string, email: string): Promise<{ isWishlisted: boolean; wishlistCount: number }> {
  try {
    const res = await fetch(`/api/components/${id}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const data = await res.json();
      toggleWishlistInFirestore(id, email, data.isWishlisted).catch(() => {});
      return data;
    }
  } catch (e) {}

  return { isWishlisted: true, wishlistCount: 1 };
}

export async function uploadComponent(componentData: Partial<UIComponentItem>): Promise<UIComponentItem> {
  const res = await fetch('/api/components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(componentData),
  });
  if (!res.ok) {
    let errorMsg = 'Failed to publish component';
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch {
      if (res.status === 413) {
        errorMsg = 'Video payload is too large. Please use a shorter clip (< 50MB) or provide a video URL link.';
      } else {
        errorMsg = `Server error (${res.status}): Failed to save component.`;
      }
    }
    throw new Error(errorMsg);
  }
  const data = await res.json();

  // Persist locally in cache so logout or offline never loses the asset
  addStoredUploadedComponent(data.component);

  // Persist into Firestore Database
  publishComponentToFirestore(data.component).catch((err) => {
    console.warn('Firestore write warning:', err);
  });

  return data.component;
}

export async function deleteComponent(id: string, email: string): Promise<boolean> {
  // 1. Remove from local persistent cache immediately
  removeStoredUploadedComponent(id);

  // 2. Call backend server endpoint
  try {
    const res = await fetch(`/api/components/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete component from server' }));
      console.warn('Server delete note:', err.error);
    }
  } catch (err) {
    console.warn('Server delete network note:', err);
  }

  // 3. Delete from Firestore Database
  try {
    await deleteComponentFromFirestore(id);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }

  return true;
}

export async function unlockAndCopyComponent(
  id: string,
  email: string
): Promise<{
  success: boolean;
  code: string;
  copyCount: number;
  remainingQuota: number;
  nextResetTimestamp: number;
  message: string;
}> {
  const res = await fetch(`/api/components/${id}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to copy component. Check daily quota.');
  }

  // Update local storage user session
  const currentUser = getStoredUser();
  if (currentUser) {
    if (!currentUser.unlockedComponentIds.includes(id)) {
      currentUser.unlockedComponentIds.push(id);
    }
    currentUser.copiedTodayCount = data.copiedTodayCount || (currentUser.copiedTodayCount || 0) + 1;
    saveStoredUser(currentUser);
  }

  return data;
}

export async function getQuotaStatus(email: string): Promise<CopyQuotaResponse> {
  try {
    const res = await fetch(`/api/auth/quota?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Quota fetch failed');
    return await res.json();
  } catch (e) {
    const user = getStoredUser();
    const count = user?.copiedTodayCount || 0;
    return {
      canCopy: count < 2,
      copiedTodayCount: count,
      maxDailyCopies: 2,
      remainingCopies: Math.max(0, 2 - count),
      nextResetTimestamp: new Date().setUTCHours(24, 0, 0, 0),
    };
  }
}
