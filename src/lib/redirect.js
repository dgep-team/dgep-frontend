/**
 * Only same-app paths are allowed as a post-login destination, so a crafted
 * link (?redirect=https://evil.example or //evil.example) can't send the guest
 * off-site after they log in.
 */
export function safeRedirect(value, fallback = '/home') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback
  }
  return value
}

/** "/login?redirect=<current path>" */
export function loginUrl(path, page = '/login') {
  return `${page}?redirect=${encodeURIComponent(path)}`
}
