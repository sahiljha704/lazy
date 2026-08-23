import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UIComponentItem, UserSession } from './types';
import {
  fetchComponents,
  getStoredUser,
  saveStoredUser,
  getQuotaStatus,
  toggleLikeComponent,
  toggleWishlistComponent,
  deleteComponent,
} from './services/api';
import { subscribeToFirebaseAuth, syncUserInFirestore, logOutFromFirebase, handleGoogleRedirectResult } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { ShowcaseView } from './components/ShowcaseView';
import { DashboardView } from './components/DashboardView';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { GmailAuthModal } from './components/GmailAuthModal';
import { UploadModal } from './components/UploadModal';
import { ShareModal } from './components/ShareModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SEED_COMPONENTS } from './data/seedComponents';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'showcase' | 'dashboard'>('home');
  const [components, setComponents] = useState<UIComponentItem[]>(SEED_COMPONENTS);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<UIComponentItem | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('access component library and copy source code');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<UIComponentItem | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<UIComponentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Navigation helper with browser history support
  const navigateToView = (view: 'home' | 'showcase' | 'dashboard', replace = false) => {
    setCurrentView(view);
    setSelectedComponent(null);
    const searchParams = new URLSearchParams(window.location.search);
    if (view === 'home') {
      searchParams.delete('view');
    } else {
      searchParams.set('view', view);
    }
    searchParams.delete('component');
    const queryString = searchParams.toString();
    const url = queryString ? `?${queryString}` : window.location.pathname;

    const state = { view, componentId: null };
    if (replace) {
      window.history.replaceState(state, '', url);
    } else {
      window.history.pushState(state, '', url);
    }
  };

  const handleSelectComponent = (comp: UIComponentItem) => {
    setSelectedComponent(comp);
    const searchParams = new URLSearchParams(window.location.search);
    if (currentView !== 'home') {
      searchParams.set('view', currentView);
    }
    searchParams.set('component', comp.id);
    const url = `?${searchParams.toString()}`;
    window.history.pushState({ view: currentView, componentId: comp.id, modal: 'component' }, '', url);
  };

  const handleCloseComponentDetail = () => {
    if (window.history.state?.modal === 'component') {
      window.history.back();
    } else {
      setSelectedComponent(null);
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('component');
      const queryString = searchParams.toString();
      const url = queryString ? `?${queryString}` : (currentView === 'home' ? '/' : `?view=${currentView}`);
      window.history.replaceState({ view: currentView, componentId: null }, '', url);
    }
  };

  const handleNavigateBack = () => {
    if (selectedComponent) {
      handleCloseComponentDetail();
    } else if (currentView !== 'home') {
      navigateToView('home');
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  // Initial load & Auth Listener & History Popstate Listener
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      // Sync fresh quota from server
      getQuotaStatus(stored.email)
        .then((quota) => {
          if (quota) {
            setCurrentUser((prev) => {
              if (!prev) return null;
              const updated: UserSession = {
                ...prev,
                copiedTodayCount: quota.copiedTodayCount,
                unlockedComponentIds: quota.unlockedComponentIds || prev.unlockedComponentIds,
              };
              saveStoredUser(updated);
              return updated;
            });
          }
        })
        .catch(() => {});
    }

    loadComponents(stored?.email);

    // Initial URL sync
    const initialParams = new URLSearchParams(window.location.search);
    const initialView = initialParams.get('view');
    if (initialView === 'showcase' || initialView === 'dashboard' || initialView === 'home') {
      setCurrentView(initialView);
    }
    const compId = initialParams.get('component');
    if (compId) {
      const found = SEED_COMPONENTS.find((c) => c.id === compId);
      if (found) {
        setSelectedComponent(found);
      }
    }

    // Real Browser Back/Forward Popstate Listener
    const handlePopState = (event: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as 'home' | 'showcase' | 'dashboard' | null;
      const compParam = params.get('component');

      const nextView = viewParam || (event.state?.view as 'home' | 'showcase' | 'dashboard') || 'home';
      setCurrentView(nextView);

      const targetCompId = compParam || event.state?.componentId;
      if (targetCompId) {
        setComponents((currentList) => {
          const found = currentList.find((c) => c.id === targetCompId) || SEED_COMPONENTS.find((c) => c.id === targetCompId);
          setSelectedComponent(found || null);
          return currentList;
        });
      } else {
        setSelectedComponent(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Subscribe to Firebase Auth changes
    const unsubscribe = subscribeToFirebaseAuth(async (fbUser) => {
      if (fbUser && fbUser.email && fbUser.email.toLowerCase().endsWith('@gmail.com')) {
        const storedUser = getStoredUser();
        const baseSession: UserSession = {
          email: fbUser.email.toLowerCase(),
          name: fbUser.displayName || storedUser?.name || fbUser.email.split('@')[0],
          avatar: storedUser?.avatar || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.email}&backgroundColor=09090b`,
          joinedAt: storedUser?.joinedAt || new Date().toISOString(),
          copiedTodayCount: storedUser?.copiedTodayCount || 0,
          unlockedComponentIds: storedUser?.unlockedComponentIds || [],
          wishlistComponentIds: storedUser?.wishlistComponentIds || [],
          likedComponentIds: storedUser?.likedComponentIds || [],
        };
        const synced = await syncUserInFirestore(baseSession);
        setCurrentUser(synced);
        saveStoredUser(synced);
      }
    });

    // Check for Google redirect result (fallback auth)
    handleGoogleRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          setCurrentUser(redirectUser);
          saveStoredUser(redirectUser);
          loadComponents(redirectUser.email);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unsubscribe();
    };
  }, []);

  const loadComponents = async (userEmail?: string) => {
    try {
      const items = await fetchComponents({ email: userEmail });
      if (items && items.length > 0) {
        setComponents(items);
      }
    } catch (e) {
      // fallback
    }
  };

  const handleRequireAuth = (reason?: string) => {
    setAuthReason(reason || 'access the Lazy UI component vault and copy production code');
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (user: UserSession, isFirstLogin?: boolean) => {
    setCurrentUser(user);
    saveStoredUser(user);
    if (isFirstLogin) {
      showToast(`Welcome to Lazy UI, ${user.name}!`);
    } else {
      showToast(`Welcome back, ${user.name}!`);
    }
    loadComponents(user.email);
  };

  const handleLogout = async () => {
    // Sign out from Firebase Auth first
    await logOutFromFirebase();
    // Clear local session (but uploaded content stays in Firestore)
    saveStoredUser(null);
    setCurrentUser(null);
    showToast('Logged out of Lazy UI.');
    loadComponents(undefined);
  };

  const handleOpenShare = (comp: UIComponentItem) => {
    setShareTarget(comp);
    setIsShareOpen(true);
  };

  const handleToggleLike = async (comp: UIComponentItem) => {
    if (!currentUser) {
      handleRequireAuth('like UI components');
      return;
    }

    const isCurrentlyLiked = currentUser.likedComponentIds?.includes(comp.id) || false;
    const updatedLikes = isCurrentlyLiked
      ? currentUser.likedComponentIds.filter((id) => id !== comp.id)
      : [...(currentUser.likedComponentIds || []), comp.id];

    const updatedUser = { ...currentUser, likedComponentIds: updatedLikes };
    setCurrentUser(updatedUser);
    saveStoredUser(updatedUser);

    setComponents((prev) =>
      prev.map((c) =>
        c.id === comp.id
          ? {
              ...c,
              likesCount: isCurrentlyLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1,
            }
          : c
      )
    );

    try {
      await toggleLikeComponent(comp.id, currentUser.email);
    } catch (e) {
      // silent
    }
  };

  const handleToggleWishlist = async (comp: UIComponentItem) => {
    if (!currentUser) {
      handleRequireAuth('bookmark components to your wishlist');
      return;
    }

    const isCurrentlySaved = currentUser.wishlistComponentIds?.includes(comp.id) || false;
    const updatedList = isCurrentlySaved
      ? currentUser.wishlistComponentIds.filter((id) => id !== comp.id)
      : [...(currentUser.wishlistComponentIds || []), comp.id];

    const updatedUser = { ...currentUser, wishlistComponentIds: updatedList };
    setCurrentUser(updatedUser);
    saveStoredUser(updatedUser);

    setComponents((prev) =>
      prev.map((c) =>
        c.id === comp.id
          ? {
              ...c,
              wishlistCount: isCurrentlySaved ? Math.max(0, c.wishlistCount - 1) : c.wishlistCount + 1,
            }
          : c
      )
    );

    showToast(isCurrentlySaved ? 'Removed from your library' : 'Saved to your library!');

    try {
      await toggleWishlistComponent(comp.id, currentUser.email);
    } catch (e) {
      // silent
    }
  };

  const handleUploadSuccess = (newComp: UIComponentItem) => {
    setComponents((prev) => [newComp, ...prev]);
    showToast(`Published "${newComp.title}" successfully!`);
    setCurrentView('dashboard');
  };

  const handleDeleteComponent = (comp: UIComponentItem) => {
    if (!currentUser?.email || !comp.authorEmail || currentUser.email.trim().toLowerCase() !== comp.authorEmail.trim().toLowerCase()) {
      showToast('You can only delete components that you uploaded.');
      return;
    }

    setComponentToDelete(comp);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete || !currentUser?.email) return;

    setIsDeleting(true);
    const target = componentToDelete;

    try {
      await deleteComponent(target.id, currentUser.email);
      setComponents((prev) => prev.filter((c) => c.id !== target.id));
      if (selectedComponent?.id === target.id) {
        setSelectedComponent(null);
      }
      setComponentToDelete(null);
      showToast(`Deleted "${target.title}" successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete component.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComponentUpdated = (updated: UIComponentItem) => {
    setComponents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedComponent && selectedComponent.id === updated.id) {
      setSelectedComponent(updated);
    }
  };

  const handleUserSessionUpdated = (user: UserSession) => {
    setCurrentUser(user);
    saveStoredUser(user);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#141414] border border-[#2B2B2B] text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left-Hand Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => navigateToView(v)}
        currentUser={currentUser}
        onOpenAuth={() => handleRequireAuth()}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <div ref={scrollContainerRef} className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 pt-4 sm:pt-6">
          {currentView === 'home' && (
            <HomeView
              components={components}
              currentUser={currentUser}
              scrollContainerRef={scrollContainerRef}
              onNavigateShowcase={() => navigateToView('showcase')}
              onNavigateDashboard={() => navigateToView('dashboard')}
              onSelectComponent={handleSelectComponent}
              onRequireAuth={handleRequireAuth}
              onOpenShare={handleOpenShare}
              onToggleLike={handleToggleLike}
              onToggleWishlist={handleToggleWishlist}
              onDeleteComponent={handleDeleteComponent}
            />
          )}

          {currentView === 'showcase' && (
            <ShowcaseView
              components={components}
              currentUser={currentUser}
              onSelectComponent={handleSelectComponent}
              onRequireAuth={handleRequireAuth}
              onOpenShare={handleOpenShare}
              onToggleLike={handleToggleLike}
              onToggleWishlist={handleToggleWishlist}
              onDeleteComponent={handleDeleteComponent}
              onNavigateBack={handleNavigateBack}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              allComponents={components}
              onSelectComponent={handleSelectComponent}
              onOpenUpload={() => setIsUploadOpen(true)}
              onRequireAuth={handleRequireAuth}
              onOpenShare={handleOpenShare}
              onToggleLike={handleToggleLike}
              onToggleWishlist={handleToggleWishlist}
              onDeleteComponent={handleDeleteComponent}
              onNavigateShowcase={() => navigateToView('showcase')}
              onNavigateBack={handleNavigateBack}
              onUserSessionUpdated={handleUserSessionUpdated}
              onShowToast={showToast}
            />
          )}
        </main>

        {/* Footer */}
        <Footer onNavigate={(v) => navigateToView(v)} />
      </div>

      {/* Component Detail Modal */}
      <ComponentDetailModal
        isOpen={Boolean(selectedComponent)}
        onClose={handleCloseComponentDetail}
        component={selectedComponent}
        currentUser={currentUser}
        onRequireAuth={handleRequireAuth}
        onOpenShare={handleOpenShare}
        onDelete={handleDeleteComponent}
        onComponentUpdated={handleComponentUpdated}
        onUserSessionUpdated={handleUserSessionUpdated}
      />

      {/* Gmail Auth Modal */}
      <GmailAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
        defaultEmail={currentUser?.email}
        actionReason={authReason}
      />

      {/* Upload Component Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentUser={currentUser}
        onRequireAuth={handleRequireAuth}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Social Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false);
          setShareTarget(null);
        }}
        component={shareTarget}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(componentToDelete)}
        onClose={() => setComponentToDelete(null)}
        onConfirm={handleConfirmDelete}
        component={componentToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
