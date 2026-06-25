/** True when user is in a read/learn/pay flow — don't yank them back to /lock. */
export function isUnlockFlowPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.includes('/unlock/') ||
    pathname === '/unlock/read' ||
    pathname === '/unlock/learn' ||
    pathname === '/unlock/pay'
  );
}
