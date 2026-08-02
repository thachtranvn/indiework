'use client';

import { Ic } from '@/components/ui/icons';

/** Dispatches the shell toggle — AppShell listens for `iw:toggle-sidebar`. */
export function toggleSidebar() {
  window.dispatchEvent(new CustomEvent('iw:toggle-sidebar'));
}

/**
 * Opens the navigation drawer. Hidden above the mobile breakpoint (CSS), where
 * the sidebar is always on screen. Inbox, All projects and Settings need it
 * because they have no project header to host the toggle ProjectTabs carries.
 */
export function NavToggle() {
  return (
    <button className="nav-toggle" type="button" onClick={toggleSidebar} aria-label="Open navigation">
      <Ic.sidebar size={18} />
    </button>
  );
}
