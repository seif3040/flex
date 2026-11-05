import { describe, expect, it } from 'vitest';
import { stripMarkdown } from '@/lib/voice/speech-synthesis';

describe('speech synthesis text preparation', () => {
  it('removes markdown syntax and code blocks', () => {
    expect(stripMarkdown('# Hello **world** [link](https://example.com)\n```js\nalert(1)\n```')).toBe('Hello world linkhttps://example.com');
  });
});
