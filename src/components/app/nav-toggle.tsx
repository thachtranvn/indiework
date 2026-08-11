'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { Ic } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

type ToggleNav = () => void;

const NavToggleContext = createContext<ToggleNav | null>(null);

/** AppShell provides the real toggle so header buttons share one handler. */
export function NavToggleProvider({
  toggle,
  children,
}: {
  toggle: ToggleNav;
  children: ReactNode;
}) {
  return <NavToggleContext.Provider value={toggle}>{children}</NavToggleContext.Provider>;
}

/**
 * Opens/collapses the nav. Falls back to a no-op outside AppShell (e.g. design
 * system demos) so those pages still render the control.
 */
export function toggleSidebar() {
  // Prefer the live context via a window bridge only when set by the provider —
  // kept for non-React callers. Prefer useToggleSidebar in components.
  const fn = typeof window !== 'undefined'
    ? (window as unknown as { __iwToggleNav?: ToggleNav }).__iwToggleNav
    : undefined;
  if (fn) {
    fn();
    return;
  }
  if (typeof console !== 'undefined') {
    console.warn('[nav-toggle] toggleSidebar called with no AppShell provider');
  }
}

/** Hook for buttons that live under AppShell. */
export function useToggleSidebar(): ToggleNav {
  const ctx = useContext(NavToggleContext);
  if (ctx) return ctx;
  return toggleSidebar;
}

/**
 * Opens the navigation drawer. Hidden above the mobile breakpoint (CSS), where
 * the sidebar is always on screen. Inbox, All projects and Settings need it
 * because they have no project header to host the toggle ProjectTabs carries.
 */
export function NavToggle() {
  const onToggle = useToggleSidebar();
  return (
    <Button
      className="nav-toggle"
      type="button"
      iconOnly
      size="sm"
      variant="tertiary"
      onClick={onToggle}
      aria-label="Open navigation"
      leftIcon={<Ic.sidebar size={18} />}
    />
  );
}
