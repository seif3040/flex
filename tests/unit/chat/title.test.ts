import { describe, expect, it } from 'vitest';
import { createConversationTitle } from '@/lib/chat/title';

describe('conversation titles', () => {
  it('uses the first message as a compact title', () => {
    expect(createConversationTitle('  Explain   this PDF to me  ')).toBe('Explain this PDF to me');
  });

  it('truncates long messages without splitting the title marker', () => {
    const title = createConversationTitle('a'.repeat(100));
    expect(title).toHaveLength(60);
    expect(title.endsWith('…')).toBe(true);
  });
});
