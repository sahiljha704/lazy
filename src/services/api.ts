import { UIComponentItem, UserSession, CopyQuotaResponse, PlatformStats, CategoryCount, CreatorLeaderboardItem } from '../types';
import { SEED_COMPONENTS } from '../data/seedComponents';
import {
  syncUserInFirestore,
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
const LOCAL_STORAGE_USERS_VAULT_KEY = 'lazy_ui_users_vault_db';

export interface StoredVaultUser extends UserSession {
  password?: string;
}

// ================= LOCAL STORAGE PERSISTENCE VAULT =================

export function getStoredUsersVault(): Record<string, StoredVaultUser> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_VAULT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    return {};
  }
}

export function saveUserToVault(user: UserSession, password?: string) {
  try {
    const cleanEmail = user.email.toLowerCase().trim();
    if (!cleanEmail) return;
    const vault = getStoredUsersVault();
    vault[cleanEmail] = {
      ...(vault[cleanEmail] || {}),
      ...user,
      email: cleanEmail,
      password: password ? password.trim() : vault[cleanEmail]?.password,
    };
    localStorage.setItem(LOCAL_STORAGE_USERS_VAULT_KEY, JSON.stringify(vault));
  } catch (e) {}
}

export function getUserFromVault(email: string): StoredVaultUser | null {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const vault = getStoredUsersVault();
    return vault[cleanEmail] || null;
  } catch (e) {
    return null;
  }
}

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
    if (user && user.email) {
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
    saveUserToVault(user);
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

// ================= AUTHENTICATION & LOGIN =================

export async function loginWithEmail(
  email: string,
  password: string,
  name?: string,
  avatar?: string
): Promise<{ user: UserSession; quota: CopyQuotaResponse; isFirstLogin?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Access denied: A valid email address is required to authenticate on Lazy UI.');
  }

  if (!password || password.length < 4) {
    throw new Error('Please enter a password with at least 4 characters.');
  }

  // Check vault for existing user account data (prevents data loss on logout)
  const existingVaultUser = getUserFromVault(cleanEmail);

  let serverData: any = null;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: password.trim(), name, avatar }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate account.');
      }
      serverData = data;
    } else if (!res.ok) {
      console.warn(`Auth API endpoint returned status ${res.status}`);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Unexpected token') && !err.message.includes('fetch')) {
      throw err;
    }
    console.warn('Backend API offline or unreachable, using local & cloud session:', err);
  }

  let finalUser: UserSession;
  let isFirstLogin = !existingVaultUser;
  let quota: CopyQuotaResponse;

  if (serverData && serverData.user) {
    finalUser = {
      ...serverData.user,
      likedComponentIds: serverData.user.likedComponentIds?.length
        ? serverData.user.likedComponentIds
        : (existingVaultUser?.likedComponentIds || []),
      wishlistComponentIds: serverData.user.wishlistComponentIds?.length
        ? serverData.user.wishlistComponentIds
        : (existingVaultUser?.wishlistComponentIds || []),
      unlockedComponentIds: serverData.user.unlockedComponentIds?.length
        ? serverData.user.unlockedComponentIds
        : (existingVaultUser?.unlockedComponentIds || []),
    };
    isFirstLogin = !!serverData.isFirstLogin;
    quota = serverData.quota || {
      canCopy: true,
      copiedTodayCount: finalUser.copiedTodayCount || 0,
      maxDailyCopies: 2,
      remainingCopies: Math.max(0, 2 - (finalUser.copiedTodayCount || 0)),
      nextResetTimestamp: new Date().setUTCHours(24, 0, 0, 0),
    };
  } else if (existingVaultUser) {
    finalUser = {
      ...existingVaultUser,
      name: name || existingVaultUser.name,
      avatar: avatar || existingVaultUser.avatar,
    };
    quota = {
      canCopy: (finalUser.copiedTodayCount || 0) < 2,
      copiedTodayCount: finalUser.copiedTodayCount || 0,
      maxDailyCopies: 2,
      remainingCopies: Math.max(0, 2 - (finalUser.copiedTodayCount || 0)),
      nextResetTimestamp: new Date().setUTCHours(24, 0, 0, 0),
    };
  } else {
    finalUser = {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}&backgroundColor=09090b`,
      joinedAt: new Date().toISOString(),
      copiedTodayCount: 0,
      unlockedComponentIds: [],
      wishlistComponentIds: [],
      likedComponentIds: [],
      isFirstLogin: true,
    };
    quota = {
      canCopy: true,
      copiedTodayCount: 0,
      maxDailyCopies: 2,
      remainingCopies: 2,
      nextResetTimestamp: new Date().setUTCHours(24, 0, 0, 0),
    };
  }

  // Sync with Firestore cloud database to restore any remote data
  try {
    const syncedUser = await syncUserInFirestore(finalUser);
    finalUser = {
      ...finalUser,
      ...syncedUser,
      likedComponentIds: Array.from(new Set([...(finalUser.likedComponentIds || []), ...(syncedUser.likedComponentIds || [])])),
      wishlistComponentIds: Array.from(new Set([...(finalUser.wishlistComponentIds || []), ...(syncedUser.wishlistComponentIds || [])])),
      unlockedComponentIds: Array.from(new Set([...(finalUser.unlockedComponentIds || []), ...(syncedUser.unlockedComponentIds || [])])),
    };
  } catch (err) {
    console.warn('Firestore user sync warning:', err);
  }

  // Save to persistent vault and active session
  saveUserToVault(finalUser, password);
  saveStoredUser(finalUser);

  return { user: finalUser, quota, isFirstLogin };
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
  saveUserToVault(updated);

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

// ================= COMPONENT FETCH & ACTIONS =================

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
  const componentMap = new Map<string, UIComponentItem>();

  // 1. Seed components as base
  for (const seed of SEED_COMPONENTS) {
    componentMap.set(seed.id, seed);
  }

  // 2. Fetch server components and Firestore components concurrently
  const [serverRes, firestoreRes] = await Promise.allSettled([
    fetch(`/api/components?${query.toString()}`).then((r) => (r.ok ? r.json() : null)),
    fetchComponentsFromFirestore(),
  ]);

  if (serverRes.status === 'fulfilled' && serverRes.value && Array.isArray(serverRes.value.components)) {
    for (const comp of serverRes.value.components) {
      componentMap.set(comp.id, comp);
    }
  }

  if (firestoreRes.status === 'fulfilled' && Array.isArray(firestoreRes.value)) {
    for (const comp of firestoreRes.value) {
      const existing = componentMap.get(comp.id);
      componentMap.set(comp.id, {
        ...comp,
        viewsCount: Math.max(comp.viewsCount || 1, existing?.viewsCount || 1),
        likesCount: Math.max(comp.likesCount || 0, existing?.likesCount || 0),
        wishlistCount: Math.max(comp.wishlistCount || 0, existing?.wishlistCount || 0),
        copyCount: Math.max(comp.copyCount || 0, existing?.copyCount || 0),
      });
    }
  }

  // 3. Merge local cached uploads
  for (const local of localCachedUploads) {
    if (!componentMap.has(local.id)) {
      componentMap.set(local.id, local);
    }
  }

  let list = Array.from(componentMap.values());

  // Apply filters
  if (params?.category && params.category !== 'All') {
    list = list.filter((c) => c.category === params.category);
  }

  if (params?.framework && params.framework !== 'All') {
    list = list.filter((c) => c.framework === params.framework);
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.authorName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  // Apply sort
  if (params?.sort === 'popular') {
    list.sort((a, b) => (b.likesCount || 0) + (b.copyCount || 0) * 2 + (b.viewsCount || 0) * 0.1 - ((a.likesCount || 0) + (a.copyCount || 0) * 2 + (a.viewsCount || 0) * 0.1));
  } else if (params?.sort === 'views') {
    list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (params?.sort === 'copies') {
    list.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
  } else if (params?.sort === 'likes') {
    list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
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
  const cleanEmail = email.toLowerCase().trim();
  const currentUser = getStoredUser();
  if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
    const isLiked = currentUser.likedComponentIds?.includes(id) || false;
    const updatedLikes = isLiked
      ? (currentUser.likedComponentIds || []).filter((item) => item !== id)
      : [...(currentUser.likedComponentIds || []), id];
    const updated = { ...currentUser, likedComponentIds: updatedLikes };
    saveStoredUser(updated);
    saveUserToVault(updated);
  }

  try {
    const res = await fetch(`/api/components/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      toggleLikeInFirestore(id, cleanEmail, data.isLiked).catch(() => {});
      return data;
    }
  } catch (e) {}

  return { isLiked: true, likesCount: 1 };
}

export async function toggleWishlistComponent(id: string, email: string): Promise<{ isWishlisted: boolean; wishlistCount: number }> {
  const cleanEmail = email.toLowerCase().trim();
  const currentUser = getStoredUser();
  if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
    const isWishlisted = currentUser.wishlistComponentIds?.includes(id) || false;
    const updatedWishlist = isWishlisted
      ? (currentUser.wishlistComponentIds || []).filter((item) => item !== id)
      : [...(currentUser.wishlistComponentIds || []), id];
    const updated = { ...currentUser, wishlistComponentIds: updatedWishlist };
    saveStoredUser(updated);
    saveUserToVault(updated);
  }

  try {
    const res = await fetch(`/api/components/${id}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      toggleWishlistInFirestore(id, cleanEmail, data.isWishlisted).catch(() => {});
      return data;
    }
  } catch (e) {}

  return { isWishlisted: true, wishlistCount: 1 };
}

export async function uploadComponent(componentData: Partial<UIComponentItem>): Promise<UIComponentItem> {
  const newComponent: UIComponentItem = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: componentData.title?.trim() || 'Untitled Component',
    category: componentData.category || 'Buttons & Actions',
    framework: componentData.framework || 'React + Tailwind',
    description: componentData.description?.trim() || 'A sleek dark & silver UI component crafted for Lazy UI.',
    authorName: componentData.authorName?.trim() || (componentData.authorEmail ? componentData.authorEmail.split('@')[0] : 'Creator'),
    authorEmail: (componentData.authorEmail || '').trim().toLowerCase(),
    tags: Array.isArray(componentData.tags) ? componentData.tags : ['DarkUI', 'Silver', 'Component'],
    viewsCount: 1,
    likesCount: 1,
    wishlistCount: 0,
    copyCount: 0,
    createdAt: new Date().toISOString(),
    liveDemoUrl: componentData.liveDemoUrl?.trim() || undefined,
    screenRecordingUrl: componentData.screenRecordingUrl || componentData.videoUrl,
    videoUrl: componentData.videoUrl || componentData.screenRecordingUrl,
    postUrl: componentData.postUrl?.trim() || undefined,
    posterUrl: componentData.posterUrl?.trim() || undefined,
    code: componentData.code?.trim() || '',
    featured: false,
    isUnlocked: true,
  };

  // 1. Immediately store in persistent local cache (never lost across logouts)
  addStoredUploadedComponent(newComponent);

  // 2. Also unlock for current user
  const currentUser = getStoredUser();
  if (currentUser) {
    if (!currentUser.unlockedComponentIds.includes(newComponent.id)) {
      currentUser.unlockedComponentIds.push(newComponent.id);
      saveStoredUser(currentUser);
      saveUserToVault(currentUser);
    }
  }

  // 3. Send to backend if online
  try {
    const res = await fetch('/api/components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComponent),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.component) {
        addStoredUploadedComponent(data.component);
        publishComponentToFirestore(data.component).catch(() => {});
        return data.component;
      }
    }
  } catch (err) {
    console.warn('Backend upload network note, falling back to Firestore & local vault:', err);
  }

  // 4. Persist to Firestore
  publishComponentToFirestore(newComponent).catch((err) => {
    console.warn('Firestore write warning:', err);
  });

  return newComponent;
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
  let serverData = null;
  try {
    const res = await fetch(`/api/components/${id}/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      serverData = await res.json();
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.error && errData.error.includes('Daily copy credit exhausted')) {
        throw new Error(errData.error);
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes('Daily copy credit exhausted')) {
      throw e;
    }
  }

  // Update user session and local vault
  const currentUser = getStoredUser();
  if (currentUser) {
    if (!currentUser.unlockedComponentIds.includes(id)) {
      currentUser.unlockedComponentIds.push(id);
    }
    currentUser.copiedTodayCount = serverData?.copiedTodayCount || (currentUser.copiedTodayCount || 0) + 1;
    saveStoredUser(currentUser);
    saveUserToVault(currentUser);
  }

  const comp = await fetchComponentById(id, email);
  const remaining = serverData?.remainingQuota ?? Math.max(0, 2 - (currentUser?.copiedTodayCount || 1));

  return {
    success: true,
    code: serverData?.code || comp?.code || '',
    copyCount: serverData?.copyCount || (comp?.copyCount || 0) + 1,
    remainingQuota: remaining,
    nextResetTimestamp: serverData?.nextResetTimestamp || new Date().setUTCHours(24, 0, 0, 0),
    message: serverData?.message || `Code copied to clipboard! (${currentUser?.copiedTodayCount || 1}/2 daily credits used)`,
  };
}

export async function getQuotaStatus(email: string): Promise<CopyQuotaResponse> {
  try {
    const res = await fetch(`/api/auth/quota?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  const user = getStoredUser() || getUserFromVault(email);
  const count = user?.copiedTodayCount || 0;
  return {
    canCopy: count < 2,
    copiedTodayCount: count,
    maxDailyCopies: 2,
    remainingCopies: Math.max(0, 2 - count),
    nextResetTimestamp: new Date().setUTCHours(24, 0, 0, 0),
  };
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  // Fallback computation
  const comps = [...getStoredUploadedComponents(), ...SEED_COMPONENTS];
  let totalCopies = 0;
  let totalLikes = 0;
  let totalViews = 0;
  const authors = new Set<string>();
  const categories = new Set<string>();

  for (const c of comps) {
    totalCopies += c.copyCount || 0;
    totalLikes += c.likesCount || 0;
    totalViews += c.viewsCount || 0;
    if (c.authorEmail) authors.add(c.authorEmail.toLowerCase());
    if (c.category) categories.add(c.category);
  }

  return {
    totalComponents: comps.length,
    totalCopies: Math.max(totalCopies, 128),
    totalLikes: Math.max(totalLikes, 342),
    totalViews: Math.max(totalViews, 1250),
    activeCreators: Math.max(authors.size, 18),
    categoriesCount: categories.size || 16,
  };
}

export async function fetchCategoriesWithCounts(): Promise<CategoryCount[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories)) {
        return data.categories;
      }
    }
  } catch (e) {}

  const comps = [...getStoredUploadedComponents(), ...SEED_COMPONENTS];
  const map = new Map<string, number>();
  for (const c of comps) {
    map.set(c.category, (map.get(c.category) || 0) + 1);
  }

  return Array.from(map.entries()).map(([name, count]) => ({
    name: name as any,
    count,
  }));
}

export async function updateUserProfile(
  email: string,
  updates: { name?: string; avatar?: string; bio?: string }
): Promise<UserSession> {
  const current = getStoredUser();
  const cleanEmail = email.trim().toLowerCase();
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}&backgroundColor=09090b`;

  const updated: UserSession = {
    email: cleanEmail,
    name: updates.name || current?.name || cleanEmail.split('@')[0],
    avatar: updates.avatar || current?.avatar || defaultAvatar,
    bio: updates.bio !== undefined ? updates.bio : current?.bio,
    joinedAt: current?.joinedAt || new Date().toISOString(),
    copiedTodayCount: current?.copiedTodayCount || 0,
    unlockedComponentIds: current?.unlockedComponentIds || [],
    wishlistComponentIds: current?.wishlistComponentIds || [],
    likedComponentIds: current?.likedComponentIds || [],
  };

  saveStoredUser(updated);
  saveUserToVault(updated);

  try {
    await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...updates }),
    });
  } catch (e) {}

  if (updates.avatar) {
    updateUserAvatarInFirestore(email, updates.avatar).catch(() => {});
  }

  return updated;
}

export async function fetchCreatorLeaderboard(): Promise<CreatorLeaderboardItem[]> {
  try {
    const res = await fetch('/api/creators/leaderboard');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.creators)) {
        return data.creators;
      }
    }
  } catch (e) {}

  // Fallback calculation from components
  const comps = [...getStoredUploadedComponents(), ...SEED_COMPONENTS];
  const map = new Map<string, { email: string; name: string; avatar: string; count: number; likes: number; copies: number; views: number }>();
  for (const c of comps) {
    const email = (c.authorEmail || 'creator@lazyui.dev').toLowerCase();
    const existing = map.get(email) || {
      email,
      name: c.authorName || email.split('@')[0],
      avatar: c.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}&backgroundColor=09090b`,
      count: 0,
      likes: 0,
      copies: 0,
      views: 0,
    };
    existing.count += 1;
    existing.likes += (c.likesCount || 0);
    existing.copies += (c.copyCount || 0);
    existing.views += (c.viewsCount || 0);
    map.set(email, existing);
  }

  const list = Array.from(map.values()).sort((a, b) => (b.count * 50 + b.likes * 10 + b.copies * 20) - (a.count * 50 + a.likes * 10 + a.copies * 20));

  return list.map((item, idx) => ({
    email: item.email,
    name: item.name,
    avatar: item.avatar,
    joinedAt: new Date().toISOString(),
    componentsCount: item.count,
    totalLikes: item.likes,
    totalCopies: item.copies,
    totalViews: item.views,
    rank: idx + 1,
    badge: idx === 0 ? '👑 Grandmaster Creator' : idx === 1 ? '🥈 Master Architect' : idx === 2 ? '🥉 Elite Contributor' : '⚡ Pro Builder',
  }));
}


