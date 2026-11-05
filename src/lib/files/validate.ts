export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'text/plain', 'text/markdown', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export class FileTooLargeError extends Error {}
export class InvalidFileTypeError extends Error {}
export function sanitizeFilename(filename: string) { const normalized = filename.normalize('NFKC').replace(/[/\\]/g, '_').replace(/[^\w. -]/g, '_').replace(/\s+/g, '-'); return normalized.slice(0, 180) || 'upload'; }
export function validateFileMetadata(file: { size: number; type: string }) { if (file.size > MAX_FILE_SIZE) throw new FileTooLargeError('File exceeds the 20 MB limit'); if (!ALLOWED_FILE_TYPES.has(file.type)) throw new InvalidFileTypeError('Unsupported file type'); }
export function validateFile(file: { size: number; type: string; bytes: Uint8Array }) { validateFileMetadata(file); const bytes = file.bytes; const valid = file.type === 'application/pdf' ? String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-' : file.type === 'image/png' ? bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]) : file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : file.type === 'image/gif' ? String.fromCharCode(...bytes.slice(0, 3)) === 'GIF' : true; if (!valid) throw new InvalidFileTypeError('File signature does not match its declared type'); }
