import { describe, expect, it } from 'vitest';
import { FileTooLargeError, InvalidFileTypeError, sanitizeFilename, validateFile } from '@/lib/files/validate';

describe('file validation', () => { it('sanitizes path traversal', () => expect(sanitizeFilename('../secret file.txt')).toBe('.._secret-file.txt')); it('rejects oversized files', () => expect(() => validateFile({ size: 21 * 1024 * 1024, type: 'text/plain', bytes: new Uint8Array() })).toThrow(FileTooLargeError)); it('rejects invalid PDF signatures', () => expect(() => validateFile({ size: 10, type: 'application/pdf', bytes: new TextEncoder().encode('hello') })).toThrow(InvalidFileTypeError)); });
