import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ChatComposer } from '@/components/chat/ChatComposer';

it('keeps Arabic drafts during composition and sends only a completed message', () => {
  const onSend = vi.fn();
  render(<ChatComposer conversationId="conversation" onSend={onSend} onStop={vi.fn()} isStreaming={false} />);

  const field = screen.getByRole('textbox', { name: 'Message' });
  const send = screen.getByRole('button', { name: 'Send' });
  expect(field).toHaveAttribute('dir', 'auto');
  expect(send).toBeDisabled();
  fireEvent.change(field, { target: { value: 'أهلاً' } });
  fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
  expect(onSend).not.toHaveBeenCalled();
  expect(field).toHaveValue('أهلاً');
  fireEvent.click(send);
  expect(onSend).toHaveBeenCalledExactlyOnceWith('أهلاً', false, false, []);
  expect(field).toHaveValue('');
});
