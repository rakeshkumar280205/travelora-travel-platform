/**
 * Populate this map with the client's verified legacy URL inventory.
 * Keys and values must be site-relative paths and must not point to APIs,
 * admin routes, external hosts, or the same path.
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {};

export function getLegacyRedirect(pathname: string) {
  const target = LEGACY_REDIRECTS[pathname];
  return target && target !== pathname ? target : null;
}
