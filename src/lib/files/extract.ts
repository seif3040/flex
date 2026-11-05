import { createRequire } from 'node:module';

export class FileExtractionError extends Error { constructor(message: string, options?: { cause?: unknown }) { super(message, options); this.name = 'FileExtractionError'; } }

export async function extractText(mimeType: string, bytes: Uint8Array): Promise<string | null> {
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') return new TextDecoder().decode(bytes);
  if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/webp' || mimeType === 'image/gif') return null;
  if (mimeType === 'application/pdf') { try { const require = createRequire(import.meta.url); const parser = require('pdf-parse/lib/pdf-parse.js') as (input: Buffer) => Promise<{ text: string }>; const result = await parser(Buffer.from(bytes)); return result.text; } catch (error) { throw new FileExtractionError('Unable to extract PDF text', { cause: error }); } }
  throw new FileExtractionError('Unsupported extraction type');
}
