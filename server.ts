import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { SEED_COMPONENTS } from './src/data/seedComponents';
import { UIComponentItem, UserSession, PlatformStats, CategoryCount, CreatorLeaderboardItem } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= PERSISTENT FILE DATABASE =================

interface StoredUserAccount {
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  password?: string; // Legacy plaintext fallback
  name: string;
  avatar: string;
  bio?: string;
  joinedAt: string;
  loginCount: number;
}

interface UserCopyRecord {
  dateKey: string; // e.g. "2026-08-25"
  copiedCount: number;
  unlockedIds: string[];
  lastCopyTime: number;
}

interface DatabaseSchema {
  version: number;
  users: Record<string, StoredUserAccount>;
  copyRecords: Record<string, UserCopyRecord>;
  likes: Record<string, string[]>; // email -> compId[]
  wishlists: Record<string, string[]>; // email -> compId[]
  customComponents: UIComponentItem[];
  views: Record<string, number>; // compId -> viewsCount
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lazy_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error creating data directory:', e);
  }
}

// In-memory state synchronized with persistent disk file
let dbData: DatabaseSchema = {
  version: 1,
  users: {},
  copyRecords: {},
  likes: {},
  wishlists: {},
  customComponents: [],
  views: {},
  lastUpdated: new Date().toISOString(),
};

// Load database from disk
function loadDatabase(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        dbData = {
          version: parsed.version || 1,
          users: parsed.users || {},
          copyRecords: parsed.copyRecords || {},
          likes: parsed.likes || {},
          wishlists: parsed.wishlists || {},
          customComponents: Array.isArray(parsed.customComponents) ? parsed.customComponents : [],
          views: parsed.views || {},
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        console.log(`[Database] Loaded ${Object.keys(dbData.users).length} users, ${dbData.customComponents.length} custom components from ${DB_FILE}`);
        return;
      }
    }
  } catch (err) {
    console.warn('[Database] Warning loading persistent database, initializing fresh state:', err);
  }
  // If no DB exists, initialize
  saveDatabase();
}

// Debounced / atomic save to disk
let saveTimeout: NodeJS.Timeout | null = null;
function saveDatabase(immediate = false): void {
  const doSave = () => {
    try {
      dbData.lastUpdated = new Date().toISOString();
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Failed to write database to disk:', err);
    }
  };

  if (immediate) {
    if (saveTimeout) clearTimeout(saveTimeout);
    doSave();
  } else {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(doSave, 100);
  }
}

// Initialize DB
loadDatabase();

// Combine seed components with custom saved components
function getAllComponents(): UIComponentItem[] {
  const customMap = new Map<string, UIComponentItem>();
  for (const c of dbData.customComponents) {
    customMap.set(c.id, c);
  }

  const result: UIComponentItem[] = [];
  // Custom uploaded components come first
  for (const c of dbData.customComponents) {
    const views = dbData.views[c.id] || c.viewsCount || 0;
    result.push({ ...c, viewsCount: views });
  }

  // Seed components
  for (const seed of SEED_COMPONENTS) {
    if (!customMap.has(seed.id)) {
      const views = dbData.views[seed.id] || seed.viewsCount || 0;
      result.push({ ...seed, viewsCount: views });
    }
  }

  return result;
}

// ================= PASSWORD CRYPTO HELPERS =================

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

function verifyPassword(password: string, user: StoredUserAccount): boolean {
  // If user has passwordHash & salt
  if (user.passwordHash && user.passwordSalt) {
    const { hash } = hashPassword(password, user.passwordSalt);
    return hash === user.passwordHash;
  }
  // Legacy plaintext match + auto upgrade to hash
  if (user.password && user.password === password.trim()) {
    const { hash, salt } = hashPassword(password.trim());
    user.passwordHash = hash;
    user.passwordSalt = salt;
    delete user.password;
    saveDatabase();
    return true;
  }
  return false;
}

// ================= CONSTANTS & HELPERS =================

const DAILY_COPY_LIMIT = 2;

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
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
};

// ================= SERVER BOOTSTRAP =================

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Request logger in dev
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Lazy UI Engine Pro');
    next();
  });

  // Track session views
  const viewedSessions = new Set<string>();

  // ================= API ROUTES =================

  // Health check & server status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '2.0.0',
      time: new Date().toISOString(),
      componentsCount: getAllComponents().length,
      usersCount: Object.keys(dbData.users).length,
      persistence: 'file-backed',
    });
  });

  // Platform Statistics
  app.get('/api/stats', (req, res) => {
    const all = getAllComponents();
    let totalCopies = 0;
    let totalLikes = 0;
    let totalViews = 0;
    const authors = new Set<string>();
    const categories = new Set<string>();

    for (const c of all) {
      totalCopies += c.copyCount || 0;
      totalLikes += c.likesCount || 0;
      totalViews += c.viewsCount || 0;
      if (c.authorEmail) authors.add(c.authorEmail.toLowerCase());
      if (c.category) categories.add(c.category);
    }

    const stats: PlatformStats = {
      totalComponents: all.length,
      totalCopies,
      totalLikes,
      totalViews,
      activeCreators: Math.max(authors.size, Object.keys(dbData.users).length),
      categoriesCount: categories.size,
    };

    res.json(stats);
  });

  // Aggregated Categories with counts
  app.get('/api/categories', (req, res) => {
    const all = getAllComponents();
    const map = new Map<string, number>();

    for (const c of all) {
      const cat = c.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + 1);
    }

    const list: CategoryCount[] = Array.from(map.entries()).map(([name, count]) => ({
      name: name as any,
      count,
    }));

    res.json({ categories: list, total: all.length });
  });

  // Creator Leaderboard
  app.get('/api/creators/leaderboard', (req, res) => {
    const all = getAllComponents();
    const creatorStats = new Map<string, {
      email: string;
      name: string;
      avatar: string;
      bio?: string;
      joinedAt: string;
      componentsCount: number;
      totalLikes: number;
      totalCopies: number;
      totalViews: number;
    }>();

    // 1. Add registered users
    for (const [email, user] of Object.entries(dbData.users)) {
      creatorStats.set(email.toLowerCase(), {
        email: user.email,
        name: user.name || email.split('@')[0],
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}&backgroundColor=09090b`,
        bio: user.bio,
        joinedAt: user.joinedAt,
        componentsCount: 0,
        totalLikes: 0,
        totalCopies: 0,
        totalViews: 0,
      });
    }

    // 2. Accumulate stats from all components
    for (const c of all) {
      if (!c.authorEmail) continue;
      const cleanEmail = c.authorEmail.toLowerCase();
      let stat = creatorStats.get(cleanEmail);
      if (!stat) {
        stat = {
          email: cleanEmail,
          name: c.authorName || cleanEmail.split('@')[0],
          avatar: c.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}&backgroundColor=09090b`,
          joinedAt: c.createdAt || new Date().toISOString(),
          componentsCount: 0,
          totalLikes: 0,
          totalCopies: 0,
          totalViews: 0,
        };
        creatorStats.set(cleanEmail, stat);
      }
      stat.componentsCount += 1;
      stat.totalLikes += (c.likesCount || 0);
      stat.totalCopies += (c.copyCount || 0);
      stat.totalViews += (c.viewsCount || 0);
    }

    const list = Array.from(creatorStats.values());

    // Sort by weighted creator score
    list.sort((a, b) => {
      const scoreA = (a.componentsCount * 60) + (a.totalLikes * 15) + (a.totalCopies * 30) + (a.totalViews * 0.2);
      const scoreB = (b.componentsCount * 60) + (b.totalLikes * 15) + (b.totalCopies * 30) + (b.totalViews * 0.2);
      return scoreB - scoreA;
    });

    const rankedList: CreatorLeaderboardItem[] = list.map((item, index) => {
      let badge = 'Active Creator';
      if (index === 0) badge = '👑 Grandmaster Creator';
      else if (index === 1) badge = '🥈 Master Architect';
      else if (index === 2) badge = '🥉 Elite Contributor';
      else if (item.componentsCount >= 3) badge = '⚡ Pro Builder';
      else if (item.totalLikes >= 10) badge = '🔥 Community Favorite';

      return {
        ...item,
        rank: index + 1,
        badge,
      };
    });

    res.json({ creators: rankedList, total: rankedList.length });
  });

  // Auth / Login with Password (Secure Hashing + Auto-Create on first login)
  app.post('/api/auth/login', (req, res) => {
    const { email, password, name, avatar, bio } = req.body || {};

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

    // Copy records lookup or init
    let record = dbData.copyRecords[cleanEmail];
    if (!record || record.dateKey !== todayKey) {
      record = {
        dateKey: todayKey,
        copiedCount: 0,
        unlockedIds: record?.unlockedIds || [],
        lastCopyTime: record?.lastCopyTime || 0,
      };
      dbData.copyRecords[cleanEmail] = record;
    }

    let account = dbData.users[cleanEmail];
    let isFirstLogin = false;

    if (!account) {
      // New account creation with secure salt & hash
      isFirstLogin = true;
      const { hash, salt } = hashPassword(password.trim());
      account = {
        email: cleanEmail,
        passwordHash: hash,
        passwordSalt: salt,
        name: name?.trim() || cleanEmail.split('@')[0],
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}&backgroundColor=09090b`,
        bio: bio?.trim() || '',
        joinedAt: new Date().toISOString(),
        loginCount: 1,
      };
      dbData.users[cleanEmail] = account;
      saveDatabase();
    } else {
      // Existing account - Verify password
      const isValid = verifyPassword(password, account);
      if (!isValid) {
        return res.status(401).json({
          error: 'Incorrect password for this account. Please enter the password you registered with.',
        });
      }
      account.loginCount = (account.loginCount || 0) + 1;
      if (name && !account.name) account.name = name.trim();
      if (avatar && !account.avatar) account.avatar = avatar;
      if (bio && !account.bio) account.bio = bio.trim();
      saveDatabase();
    }

    const userLikes = dbData.likes[cleanEmail] || [];
    const userWishlists = dbData.wishlists[cleanEmail] || [];

    const userSession: UserSession = {
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      bio: account.bio,
      joinedAt: account.joinedAt,
      copiedTodayCount: record.copiedCount,
      unlockedComponentIds: record.unlockedIds,
      wishlistComponentIds: userWishlists,
      likedComponentIds: userLikes,
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

  // Update Profile (Name, Avatar, Bio)
  app.post('/api/auth/update-profile', (req, res) => {
    const { email, name, avatar, bio } = req.body || {};
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email address required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    let account = dbData.users[cleanEmail];
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (typeof name === 'string' && name.trim()) account.name = name.trim();
    if (typeof avatar === 'string' && avatar.trim()) account.avatar = avatar.trim();
    if (typeof bio === 'string') account.bio = bio.trim();

    saveDatabase();

    res.json({
      success: true,
      user: {
        email: account.email,
        name: account.name,
        avatar: account.avatar,
        bio: account.bio,
        joinedAt: account.joinedAt,
      },
    });
  });

  // Avatar Update Route
  app.post('/api/auth/avatar', (req, res) => {
    const { email, avatar } = req.body || {};
    if (!email || !isValidEmail(email) || !avatar) {
      return res.status(400).json({ error: 'Valid email and avatar URL required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    let account = dbData.users[cleanEmail];
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
      dbData.users[cleanEmail] = account;
    }
    saveDatabase();
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
    const record = dbData.copyRecords[cleanEmail];

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

  // Get Components List with search, category, framework, and sort
  app.get('/api/components', (req, res) => {
    const { category, search, framework, sort, email } = req.query;
    const cleanEmail = email && typeof email === 'string' && isValidEmail(email) ? email.trim().toLowerCase() : null;

    let filtered = getAllComponents();

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
          c.authorName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
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
      // newest
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const userRecord = cleanEmail ? dbData.copyRecords[cleanEmail] : null;
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

    const all = getAllComponents();
    const comp = all.find((c) => c.id === id);
    if (!comp) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const userRecord = cleanEmail ? dbData.copyRecords[cleanEmail] : null;
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

  // UNLOCK & COPY SOURCE CODE (Strict 2 Copies Per Day Rule with Reset at Midnight UTC)
  app.post('/api/components/:id/copy', (req, res) => {
    const { id } = req.params;
    const { email } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(401).json({
        error: 'Authentication required. Please log in with a valid email address to copy code.',
      });
    }

    const all = getAllComponents();
    const comp = all.find((c) => c.id === id);
    if (!comp) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const todayKey = getTodayKey();

    let record = dbData.copyRecords[cleanEmail];
    if (!record || record.dateKey !== todayKey) {
      record = {
        dateKey: todayKey,
        copiedCount: 0,
        unlockedIds: record?.unlockedIds || [],
        lastCopyTime: record?.lastCopyTime || 0,
      };
      dbData.copyRecords[cleanEmail] = record;
    }

    // STRICT CREDIT CHECK: 2 copies max per day
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

    // Execute copy
    record.copiedCount += 1;
    record.lastCopyTime = Date.now();
    if (!record.unlockedIds.includes(id)) {
      record.unlockedIds.push(id);
    }

    comp.copyCount = (comp.copyCount || 0) + 1;

    // If it's a custom component, update it in DB
    const customIndex = dbData.customComponents.findIndex((c) => c.id === id);
    if (customIndex !== -1) {
      dbData.customComponents[customIndex].copyCount = comp.copyCount;
    }

    saveDatabase();

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

  // Toggle Like
  app.post('/api/components/:id/like', (req, res) => {
    const { id } = req.params;
    const { email } = req.body || {};
    if (!email || !isValidEmail(email)) {
      return res.status(401).json({ error: 'Please log in with a valid email account to like components.' });
    }

    const all = getAllComponents();
    const comp = all.find((c) => c.id === id);
    if (!comp) return res.status(404).json({ error: 'Component not found' });

    const cleanEmail = email.trim().toLowerCase();
    if (!dbData.likes[cleanEmail]) {
      dbData.likes[cleanEmail] = [];
    }

    const userLikes = dbData.likes[cleanEmail];
    const isLiked = userLikes.includes(id);

    if (isLiked) {
      dbData.likes[cleanEmail] = userLikes.filter((item) => item !== id);
      comp.likesCount = Math.max(0, (comp.likesCount || 0) - 1);
    } else {
      userLikes.push(id);
      comp.likesCount = (comp.likesCount || 0) + 1;
    }

    const customIndex = dbData.customComponents.findIndex((c) => c.id === id);
    if (customIndex !== -1) {
      dbData.customComponents[customIndex].likesCount = comp.likesCount;
    }

    saveDatabase();

    res.json({ isLiked: !isLiked, likesCount: comp.likesCount });
  });

  // Toggle Wishlist
  app.post('/api/components/:id/wishlist', (req, res) => {
    const { id } = req.params;
    const { email } = req.body || {};
    if (!email || !isValidEmail(email)) {
      return res.status(401).json({ error: 'Please log in with a valid email account to bookmark components.' });
    }

    const all = getAllComponents();
    const comp = all.find((c) => c.id === id);
    if (!comp) return res.status(404).json({ error: 'Component not found' });

    const cleanEmail = email.trim().toLowerCase();
    if (!dbData.wishlists[cleanEmail]) {
      dbData.wishlists[cleanEmail] = [];
    }

    const userWishlists = dbData.wishlists[cleanEmail];
    const isWishlisted = userWishlists.includes(id);

    if (isWishlisted) {
      dbData.wishlists[cleanEmail] = userWishlists.filter((item) => item !== id);
      comp.wishlistCount = Math.max(0, (comp.wishlistCount || 0) - 1);
    } else {
      userWishlists.push(id);
      comp.wishlistCount = (comp.wishlistCount || 0) + 1;
    }

    const customIndex = dbData.customComponents.findIndex((c) => c.id === id);
    if (customIndex !== -1) {
      dbData.customComponents[customIndex].wishlistCount = comp.wishlistCount;
    }

    saveDatabase();

    res.json({ isWishlisted: !isWishlisted, wishlistCount: comp.wishlistCount });
  });

  // Increment & Record Real View Count
  app.post('/api/components/:id/view', (req, res) => {
    const { id } = req.params;
    const { viewerId } = req.body || {};
    const all = getAllComponents();
    const comp = all.find((c) => c.id === id);
    if (!comp) return res.status(404).json({ error: 'Component not found' });

    const cleanViewerId = viewerId && typeof viewerId === 'string' && viewerId.trim()
      ? viewerId.trim()
      : (req.ip || 'viewer_anonymous');
    const viewKey = `${cleanViewerId}_${id}`;

    if (!viewedSessions.has(viewKey)) {
      viewedSessions.add(viewKey);
      const currentViews = dbData.views[id] || comp.viewsCount || 0;
      dbData.views[id] = currentViews + 1;
      comp.viewsCount = dbData.views[id];

      const customIndex = dbData.customComponents.findIndex((c) => c.id === id);
      if (customIndex !== -1) {
        dbData.customComponents[customIndex].viewsCount = comp.viewsCount;
      }
      saveDatabase();
    }

    res.json({ success: true, viewsCount: dbData.views[id] || comp.viewsCount });
  });

  // Upload New UI Component
  app.post('/api/components', (req, res) => {
    const {
      id,
      title,
      category,
      framework,
      description,
      authorName,
      authorEmail,
      authorAvatar,
      tags,
      screenRecordingUrl,
      videoUrl,
      postUrl,
      posterUrl,
      liveDemoUrl,
      code,
      extraStyles,
      interactiveType,
    } = req.body || {};

    if (!authorEmail || !isValidEmail(authorEmail)) {
      return res.status(400).json({ error: 'You must be logged in with a valid email account to upload.' });
    }

    if (!title || !code) {
      return res.status(400).json({
        error: 'Missing required fields: Title and Code are mandatory.',
      });
    }

    const cleanEmail = authorEmail.trim().toLowerCase();
    const finalVideoUrl = (screenRecordingUrl || videoUrl || '').trim();
    const finalPostUrl = (postUrl || '').trim();
    const compId = id && typeof id === 'string' && id.trim()
      ? id.trim()
      : `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newComponent: UIComponentItem = {
      id: compId,
      title: title.trim(),
      category: category || 'Buttons & Actions',
      framework: framework || 'React + Tailwind',
      description: description?.trim() || 'A sleek dark & silver UI component crafted for Lazy UI.',
      authorName: authorName?.trim() || cleanEmail.split('@')[0],
      authorEmail: cleanEmail,
      authorAvatar: authorAvatar?.trim() || undefined,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['DarkUI', 'Silver', 'Component'],
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
      extraStyles: extraStyles?.trim() || undefined,
      interactiveType: interactiveType?.trim() || undefined,
      featured: false,
    };

    // Save to persistent array (deduplicate if existing)
    dbData.customComponents = dbData.customComponents.filter((c) => c.id !== compId);
    dbData.customComponents.unshift(newComponent);
    if (!dbData.views[compId]) {
      dbData.views[compId] = 1;
    }

    // Auto unlock for author
    let record = dbData.copyRecords[cleanEmail];
    if (record) {
      if (!record.unlockedIds.includes(newComponent.id)) {
        record.unlockedIds.push(newComponent.id);
      }
    } else {
      dbData.copyRecords[cleanEmail] = {
        dateKey: getTodayKey(),
        copiedCount: 0,
        unlockedIds: [newComponent.id],
        lastCopyTime: 0,
      };
    }

    saveDatabase(true);

    res.status(201).json({ component: newComponent });
  });

  // Delete Component (Author only)
  app.delete('/api/components/:id', (req, res) => {
    const { id } = req.params;
    const { email } = req.body || {};

    const cleanEmail = (email || '').trim().toLowerCase();
    const compIndex = dbData.customComponents.findIndex((c) => c.id === id);

    if (compIndex === -1) {
      // Check if it was a seed component or already removed
      return res.json({ success: true, message: 'Component removed or was not in database', id });
    }

    const comp = dbData.customComponents[compIndex];
    const authorEmail = (comp.authorEmail || '').trim().toLowerCase();

    if (!cleanEmail || !authorEmail || authorEmail !== cleanEmail) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete components that you authored.' });
    }

    dbData.customComponents.splice(compIndex, 1);
    delete dbData.views[id];
    saveDatabase(true);

    res.json({ success: true, message: 'Component deleted successfully', id });
  });

  // Global Error Handler for oversized uploads & JSON parsing issues
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413)) {
      return res.status(413).json({
        error: 'Payload too large. Please select a shorter video recording clip (< 50MB) or provide an external video link.',
      });
    }
    if (err) {
      console.error('Unhandled server error:', err);
      return res.status(err.status || 500).json({
        error: err.message || 'An unexpected server error occurred.',
      });
    }
    next();
  });

  // Vite middleware for development & production asset serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Lazy UI] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
