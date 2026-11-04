import { describe, it, expect } from 'vitest';
import { sanitizeRedirectUrl } from '@/lib/auth/redirect';

describe('Open Redirect Prevention (sanitizeRedirectUrl)', () => {
  it('allows safe relative internal paths', () => {
    expect(sanitizeRedirectUrl('/')).toBe('/');
    expect(sanitizeRedirectUrl('/c/123')).toBe('/c/123');
    expect(sanitizeRedirectUrl('/settings?tab=keys')).toBe('/settings?tab=keys');
    expect(sanitizeRedirectUrl('/projects/abc-def#section')).toBe(
      '/projects/abc-def#section'
    );
  });

  it('rejects protocol-relative URLs (//evil.com)', () => {
    expect(sanitizeRedirectUrl('//evil.com')).toBe('/');
    expect(sanitizeRedirectUrl('//evil.com/path')).toBe('/');
    expect(sanitizeRedirectUrl('///evil.com')).toBe('/');
  });

  it('rejects absolute URLs with external domains', () => {
    expect(sanitizeRedirectUrl('https://evil.com')).toBe('/');
    expect(sanitizeRedirectUrl('http://evil.com/steal-token')).toBe('/');
    expect(sanitizeRedirectUrl('ftp://evil.com')).toBe('/');
  });

  it('rejects backslash-based bypass techniques', () => {
    expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/');
    expect(sanitizeRedirectUrl('\\evil.com')).toBe('/');
    expect(sanitizeRedirectUrl('/path\\evil.com')).toBe('/');
  });

  it('rejects javascript and data URIs', () => {
    expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(sanitizeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(
      '/'
    );
  });

  it('handles null, undefined, and empty string by returning fallback', () => {
    expect(sanitizeRedirectUrl(null)).toBe('/');
    expect(sanitizeRedirectUrl(undefined)).toBe('/');
    expect(sanitizeRedirectUrl('')).toBe('/');
    expect(sanitizeRedirectUrl('   ')).toBe('/');
    expect(sanitizeRedirectUrl(null, '/custom-fallback')).toBe('/custom-fallback');
  });

  it('rejects control characters and malformed strings', () => {
    expect(sanitizeRedirectUrl('/path\x00evil')).toBe('/');
    expect(sanitizeRedirectUrl('/path\r\nevil')).toBe('/');
  });
});
