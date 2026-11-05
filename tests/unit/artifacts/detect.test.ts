import { describe, expect, it } from 'vitest';
import { detectArtifacts } from '@/lib/artifacts/detect';

describe('artifact detection', () => { it('detects worthy language blocks', () => expect(detectArtifacts('```tsx\nexport default function App() {}\n```')[0]?.language).toBe('tsx')); it('ignores short plain snippets', () => expect(detectArtifacts('```text\nhello\n```')).toHaveLength(0)); });
