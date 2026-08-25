export type ComponentCategory =
  | 'All'
  | 'Buttons & Actions'
  | 'Cards & Bionic UI'
  | 'Navigation & Menus'
  | 'Inputs & Forms'
  | 'Hero & Headers'
  | 'Modals & Overlays'
  | 'Badges & Indicators'
  | 'Text & Typography Animations'
  | 'Loaders & Spinners'
  | 'Footers & Bottom Bars'
  | 'Pricing & Tables'
  | 'Carousels & Sliders'
  | 'Bento Grids'
  | 'Sidebar & Drawers'
  | 'Tooltips & Popovers'
  | 'Charts & Visualizations';

export type Framework =
  | 'React + Tailwind'
  | 'Next.js'
  | 'HTML + Tailwind'
  | 'Vue 3'
  | 'Svelte'
  | 'Framer Motion'
  | 'Vanilla CSS';

export interface UIComponentItem {
  id: string;
  title: string;
  category: ComponentCategory;
  framework: Framework;
  description: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  tags: string[];
  viewsCount: number;
  likesCount: number;
  wishlistCount: number;
  copyCount: number;
  createdAt: string;
  liveDemoUrl?: string;
  // Screen recording video URL or direct video URL
  screenRecordingUrl?: string;
  videoUrl?: string;
  // Social/showcase post URL (X/Twitter, Bluesky, LinkedIn, etc.)
  postUrl?: string;
  // Fallback video poster image or animation thumbnail
  posterUrl?: string;
  // Full raw source code
  code: string;
  // CSS or additional styles if needed
  extraStyles?: string;
  // Interactive component identifier for live client-side sandbox render
  interactiveType?: string;
  featured?: boolean;
  isUnlocked?: boolean;
}

export interface UserSession {
  email: string;
  name: string;
  avatar: string;
  bio?: string;
  joinedAt: string;
  // Daily copy tracking (2 copies per day reset at UTC midnight)
  lastCopiedTimestamp?: number;
  copiedTodayCount: number;
  unlockedComponentIds: string[]; // List of IDs copied
  wishlistComponentIds: string[];
  likedComponentIds: string[];
  isFirstLogin?: boolean;
}

export interface PlatformStats {
  totalComponents: number;
  totalCopies: number;
  totalLikes: number;
  totalViews: number;
  activeCreators: number;
  categoriesCount: number;
}

export interface CategoryCount {
  name: ComponentCategory;
  count: number;
  icon?: string;
}

export interface CreatorLeaderboardItem {
  email: string;
  name: string;
  avatar: string;
  bio?: string;
  joinedAt: string;
  componentsCount: number;
  totalLikes: number;
  totalCopies: number;
  totalViews: number;
  rank: number;
  badge?: string;
}

export interface CopyQuotaResponse {
  canCopy: boolean;
  copiedTodayCount: number;
  maxDailyCopies: number;
  remainingCopies?: number;
  nextResetTimestamp: number;
  unlockedComponentIds?: string[];
  message?: string;
  isLoggedIn?: boolean;
}



