import { describe, expect, it } from 'vitest';
import { chatSchema } from '@/schemas/chat';

const base = {
  conversationId: '00000000-0000-4000-8000-000000000001',
  content: 'Try again',
  modelId: 'openai/gpt-4o-mini',
};

describe('chat request schema', () => {
  it('accepts regeneration requests linked to an existing user message', () => {
    const parsed = chatSchema.parse({
      ...base,
      parentId: '00000000-0000-4000-8000-000000000002',
      regenerate: true,
    });

    expect(parsed.regenerate).toBe(true);
    expect(parsed.parentId).toBe('00000000-0000-4000-8000-000000000002');
  });

  it('defaults optional chat controls safely', () => {
    expect(chatSchema.parse(base)).toMatchObject({
      regenerate: false,
      useMemory: false,
      useWebSearch: false,
    });
  });
});
