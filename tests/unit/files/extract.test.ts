import { describe, expect, it } from 'vitest';
// @vitest-environment node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { FileExtractionError, extractText } from '@/lib/files/extract';

describe('file text extraction', () => { it('extracts text directly', async () => { await expect(extractText('text/plain', new TextEncoder().encode('hello'))).resolves.toBe('hello'); }); it('extracts text from a valid PDF fixture', async () => { const bytes = readFileSync(path.join(process.cwd(), 'node_modules/pdf-parse/test/data/01-valid.pdf')); await expect(extractText('application/pdf', bytes)).resolves.toEqual(expect.any(String)); }); it('returns null for images', async () => { await expect(extractText('image/png', new Uint8Array([1, 2]))).resolves.toBeNull(); }); it('throws a typed error for corrupt PDF', async () => { await expect(extractText('application/pdf', new TextEncoder().encode('%PDF-corrupt'))).rejects.toBeInstanceOf(FileExtractionError); }); });
