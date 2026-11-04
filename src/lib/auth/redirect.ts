/**
 * Validates and sanitizes a redirect URL to prevent Open Redirect vulnerabilities.
 * Ensures the destination is an internal relative path on the same origin.
 *
 * Disallowed patterns:
 * - Absolute URLs with protocol (e.g., https://evil.com)
 * - Protocol-relative URLs (e.g., //evil.com)
 * - Backslash-prefixed paths (e.g., /\evil.com)
 * - Dangerous URI schemes (e.g., javascript:, data:)
 * - Malformed URIs
 */
export function sanitizeRedirectUrl(
  destination: string | null | undefined,
  defaultDestination = '/'
): string {
  if (!destination || typeof destination !== 'string') {
    return defaultDestination;
  }

  const trimmed = destination.trim();

  if (trimmed === '') {
    return defaultDestination;
  }

  // Must begin with a single forward slash and not a double slash (protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultDestination;
  }

  // Disallow any backslash which might be interpreted as path separator by some browsers
  if (trimmed.includes('\\')) {
    return defaultDestination;
  }

  // Disallow control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return defaultDestination;
  }

  try {
    // Parse using dummy base to ensure it remains on the same origin and path
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return defaultDestination;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultDestination;
  }
}
