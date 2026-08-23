import express from 'express';
import { SEED_COMPONENTS } from '../src/data/seedComponents';
import { UIComponentItem, UserSession } from '../src/types';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// In-memory persistent state (seeded with Dia Text Reveal)
let components: UIComponentItem[] = [...SEED_COMPONENTS];

interface StoredUserAccount {
  email: string;
  password?: string;
  name: string;
  avatar: string;
  joinedAt: string;
  loginCount: number;
}
const userAccounts = new Map<string, StoredUserAccount>();

const DAILY_COPY_LIMIT = 2;

interface UserCopyRecord {
  dateKey: string;
  copiedCount: number;
  unlockedIds: string[];
  lastCopyTime: number;
}
const copyRecords = new Map<string, UserCopyRecord>();

const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const getNextMidnightUTC = (): number => {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
};

const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return email.includes('@');
};

// ================= API ROUTES =================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth / Login with Password
app.post('/api/auth/login', (req, res) => {
  const { email, password, name, avatar } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: 'A valid email address is required to authenticate on Lazy UI.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({
      error: 'Password is required and must be at least 4 characters long.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const todayKey = getTodayKey();
  let record = copyRecords.get(cleanEmail);
  if (!record || record.dateKey !== todayKey) {
    record = {
      dateKey: todayKey,
      copiedCount: 0,
      unlockedIds: record?.unlockedIds || [],
      lastCopyTime: record?.lastCopyTime || 0,
    };
    copyRecords.set(cleanEmail, record);
  }

  let account = userAccounts.get(cleanEmail);
  let isFirstLogin = false;

  if (!account) {
    isFirstLogin = true;
    account = {
      email: cleanEmail,
      password: password.trim(),
      name: name || cleanEmail.split('@')[0],
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}&backgroundColor=09090b`,
      joinedAt: new Date().toISOString(),
      loginCount: 1,
    };
    userAccounts.set(cleanEmail, account);
  } else {
    if (account.password && account.password !== password.trim()) {
      return res.status(401).json({
        error: 'Incorrect password for this account. Please enter the password you registered with.',
      });
    }
    account.loginCount += 1;
    if (name) account.name = name;
    if (avatar) account.avatar = avatar;
  }

  const userSession: UserSession = {
    email: account.email,
    name: account.name,
    avatar: account.avatar,
    joinedAt: account.joinedAt,
    copiedTodayCount: record.copiedCount,
    unlockedComponentIds: record.unlockedIds,
    wishlistComponentIds: [],
    likedComponentIds: [],
    isFirstLogin,
  };

  const canCopy = record.copiedCount < DAILY_COPY_LIMIT;
  res.json({
    user: userSession,
    isFirstLogin,
    quota: {
      canCopy,
      copiedTodayCount: record.copiedCount,
      maxDailyCopies: DAILY_COPY_LIMIT,
      remainingCopies: Math.max(0, DAILY_COPY_LIMIT - record.copiedCount),
      nextResetTimestamp: getNextMidnightUTC(),
    },
  });
});

// Avatar Update Route
app.post('/api/auth/avatar', (req, res) => {
  const { email, avatar } = req.body;
  if (!email || !isValidEmail(email) || !avatar) {
    return res.status(400).json({ error: 'Valid email and avatar URL required.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  let account = userAccounts.get(cleanEmail);
  if (account) {
    account.avatar = avatar;
  } else {
    account = {
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      avatar,
      joinedAt: new Date().toISOString(),
      loginCount: 1,
    };
    userAccounts.set(cleanEmail, account);
  }
  res.json({ success: true, avatar });
});

// Get user quota
app.get('/api/auth/quota', (req, res) => {
  const email = req.query.email as string;
  if (!email || !isValidEmail(email)) {
    return res.json({
      canCopy: false,
      copiedTodayCount: 0,
      maxDailyCopies: DAILY_COPY_LIMIT,
      remainingCopies: 0,
      nextResetTimestamp: getNextMidnightUTC(),
      isLoggedIn: false,
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const todayKey = getTodayKey();
  const record = copyRecords.get(cleanEmail);

  let count = 0;
  let unlocked: string[] = [];
  if (record && record.dateKey === todayKey) {
    count = record.copiedCount;
    unlocked = record.unlockedIds;
  } else if (record) {
    unlocked = record.unlockedIds;
  }

  res.json({
    canCopy: count < DAILY_COPY_LIMIT,
    copiedTodayCount: count,
    maxDailyCopies: DAILY_COPY_LIMIT,
    remainingCopies: Math.max(0, DAILY_COPY_LIMIT - count),
    nextResetTimestamp: getNextMidnightUTC(),
    unlockedComponentIds: unlocked,
    isLoggedIn: true,
  });
});

// Get Components List
app.get('/api/components', (req, res) => {
  const { category, search, framework, sort, email } = req.query;
  const cleanEmail = email && typeof email === 'string' && isValidEmail(email) ? email.trim().toLowerCase() : null;

  let filtered = [...components];

  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.category === category);
  }

  if (framework && framework !== 'All') {
    filtered = filtered.filter((c) => c.framework === framework);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.authorName.toLowerCase().includes(q)
    );
  }

  if (sort === 'popular') {
    filtered.sort((a, b) => (b.likesCount || 0) + (b.copyCount || 0) * 2 + (b.viewsCount || 0) * 0.1 - ((a.likesCount || 0) + (a.copyCount || 0) * 2 + (a.viewsCount || 0) * 0.1));
  } else if (sort === 'views') {
    filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (sort === 'copies') {
    filtered.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
  } else if (sort === 'likes') {
    filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const userRecord = cleanEmail ? copyRecords.get(cleanEmail) : null;
  const unlockedSet = new Set(userRecord?.unlockedIds || []);

  const resultList = filtered.map((c) => {
    const isAuthor = cleanEmail && c.authorEmail.toLowerCase() === cleanEmail;
    const isUnlocked = unlockedSet.has(c.id);

    return {
      ...c,
      code: c.code,
      isUnlocked: isAuthor || isUnlocked,
    };
  });

  res.json({ components: resultList, total: resultList.length });
});

// Get Single Component
app.get('/api/components/:id', (req, res) => {
  const { id } = req.params;
  const email = req.query.email as string;
  const cleanEmail = email && isValidEmail(email) ? email.trim().toLowerCase() : null;

  const comp = components.find((c) => c.id === id);
  if (!comp) {
    return res.status(404).json({ error: 'Component not found' });
  }

  const userRecord = cleanEmail ? copyRecords.get(cleanEmail) : null;
  const isUnlocked = userRecord?.unlockedIds?.includes(id) || false;
  const isAuthor = cleanEmail && comp.authorEmail.toLowerCase() === cleanEmail;

  res.json({
    component: {
      ...comp,
      code: comp.code,
      isUnlocked: isAuthor || isUnlocked,
    },
  });
});

// UNLOCK & COPY SOURCE CODE
app.post('/api/components/:id/copy', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(401).json({
      error: 'Authentication required. Please log in with a valid email address to copy code.',
    });
  }

  const comp = components.find((c) => c.id === id);
  if (!comp) {
    return res.status(404).json({ error: 'Component not found' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const todayKey = getTodayKey();

  let record = copyRecords.get(cleanEmail);
  if (!record || record.dateKey !== todayKey) {
    record = {
      dateKey: todayKey,
      copiedCount: 0,
      unlockedIds: record?.unlockedIds || [],
      lastCopyTime: record?.lastCopyTime || 0,
    };
    copyRecords.set(cleanEmail, record);
  }

  if (record.copiedCount >= DAILY_COPY_LIMIT) {
    return res.status(429).json({
      error: `Daily copy credit exhausted (0/${DAILY_COPY_LIMIT} remaining today). You cannot copy any code until your credit resets at midnight UTC.`,
      canCopy: false,
      copiedTodayCount: record.copiedCount,
      maxDailyCopies: DAILY_COPY_LIMIT,
      remainingCopies: 0,
      nextResetTimestamp: getNextMidnightUTC(),
    });
  }

  record.copiedCount += 1;
  record.lastCopyTime = Date.now();
  if (!record.unlockedIds.includes(id)) {
    record.unlockedIds.push(id);
  }
  comp.copyCount += 1;

  const remainingQuota = Math.max(0, DAILY_COPY_LIMIT - record.copiedCount);

  res.json({
    success: true,
    code: comp.code,
    copyCount: comp.copyCount,
    alreadyUnlocked: false,
    copiedTodayCount: record.copiedCount,
    remainingQuota,
    remainingCopies: remainingQuota,
    maxDailyCopies: DAILY_COPY_LIMIT,
    nextResetTimestamp: getNextMidnightUTC(),
    message: `Code copied to clipboard! (${record.copiedCount}/${DAILY_COPY_LIMIT} daily credits used)`,
  });
});

const userLikes = new Map<string, Set<string>>();
const userWishlists = new Map<string, Set<string>>();

// Toggle Like
app.post('/api/components/:id/like', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(401).json({ error: 'Please log in with a valid email account to like components.' });
  }

  const comp = components.find((c) => c.id === id);
  if (!comp) return res.status(404).json({ error: 'Component not found' });

  const cleanEmail = email.trim().toLowerCase();
  let likes = userLikes.get(cleanEmail);
  if (!likes) {
    likes = new Set<string>();
    userLikes.set(cleanEmail, likes);
  }

  const isLiked = likes.has(id);
  if (isLiked) {
    likes.delete(id);
    comp.likesCount = Math.max(0, comp.likesCount - 1);
  } else {
    likes.add(id);
    comp.likesCount += 1;
  }

  res.json({ isLiked: !isLiked, likesCount: comp.likesCount });
});

// Toggle Wishlist
app.post('/api/components/:id/wishlist', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(401).json({ error: 'Please log in with a valid email account to bookmark components.' });
  }

  const comp = components.find((c) => c.id === id);
  if (!comp) return res.status(404).json({ error: 'Component not found' });

  const cleanEmail = email.trim().toLowerCase();
  let wishlists = userWishlists.get(cleanEmail);
  if (!wishlists) {
    wishlists = new Set<string>();
    userWishlists.set(cleanEmail, wishlists);
  }

  const isWishlisted = wishlists.has(id);
  if (isWishlisted) {
    wishlists.delete(id);
    comp.wishlistCount = Math.max(0, comp.wishlistCount - 1);
  } else {
    wishlists.add(id);
    comp.wishlistCount += 1;
  }

  res.json({ isWishlisted: !isWishlisted, wishlistCount: comp.wishlistCount });
});

// Increment & Record Real View Count
app.post('/api/components/:id/view', (req, res) => {
  const { id } = req.params;
  const comp = components.find((c) => c.id === id);
  if (!comp) return res.status(404).json({ error: 'Component not found' });

  comp.viewsCount = (comp.viewsCount || 0) + 1;
  res.json({ success: true, viewsCount: comp.viewsCount });
});

// Upload New UI Component
app.post('/api/components', (req, res) => {
  const { title, category, framework, description, authorName, authorEmail, tags, screenRecordingUrl, videoUrl, postUrl, posterUrl, liveDemoUrl, code } = req.body;

  if (!authorEmail || !isValidEmail(authorEmail)) {
    return res.status(400).json({ error: 'You must be logged in with a valid email account to upload.' });
  }

  if (!title || !code) {
    return res.status(400).json({
      error: 'Missing required fields: Title and Code are mandatory.',
    });
  }

  const finalVideoUrl = (screenRecordingUrl || videoUrl || '').trim();
  const finalPostUrl = (postUrl || '').trim();

  const newComponent: UIComponentItem = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    category: category || 'Buttons & Actions',
    framework: framework || 'React + Tailwind',
    description: description?.trim() || 'A sleek dark & silver UI component crafted for Lazy UI.',
    authorName: authorName?.trim() || authorEmail.split('@')[0],
    authorEmail: authorEmail.trim().toLowerCase(),
    tags: Array.isArray(tags) ? tags : ['DarkUI', 'Silver', 'Component'],
    viewsCount: 1,
    likesCount: 1,
    wishlistCount: 0,
    copyCount: 0,
    createdAt: new Date().toISOString(),
    liveDemoUrl: liveDemoUrl?.trim() || undefined,
    screenRecordingUrl: finalVideoUrl || undefined,
    videoUrl: finalVideoUrl || undefined,
    postUrl: finalPostUrl || undefined,
    posterUrl: posterUrl?.trim() || undefined,
    code: code.trim(),
    featured: false,
  };

  components.unshift(newComponent);

  const cleanEmail = authorEmail.trim().toLowerCase();
  let record = copyRecords.get(cleanEmail);
  if (record) {
    record.unlockedIds.push(newComponent.id);
  } else {
    copyRecords.set(cleanEmail, {
      dateKey: getTodayKey(),
      copiedCount: 0,
      unlockedIds: [newComponent.id],
      lastCopyTime: 0,
    });
  }

  res.status(201).json({ component: newComponent });
});

// Delete Component (Author only)
app.delete('/api/components/:id', (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};

  const compIndex = components.findIndex((c) => c.id === id);
  if (compIndex === -1) {
    return res.json({ success: true, message: 'Component removed or was not in server memory', id });
  }

  const comp = components[compIndex];
  const authorEmail = (comp.authorEmail || '').trim().toLowerCase();
  const reqEmail = (email || '').trim().toLowerCase();

  if (!reqEmail || !authorEmail || authorEmail !== reqEmail) {
    return res.status(403).json({ error: 'Unauthorized: You can only delete components that you authored.' });
  }

  components.splice(compIndex, 1);
  res.json({ success: true, message: 'Component deleted successfully', id });
});

export default app;
