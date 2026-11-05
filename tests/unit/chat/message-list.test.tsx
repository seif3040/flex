import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MessageList } from '@/components/chat/MessageList';

it('preserves a failed edit until cancel, then reopens with the saved message', async () => {
  const onEdit = vi.fn().mockRejectedValue(new Error('Offline'));
  render(<MessageList messages={[{ id: 'test', role: 'user', content: 'النص المحفوظ' }]} isStreaming={false} onEdit={onEdit} />);

  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  const input = screen.getByRole('textbox', { name: 'Edit message' });
  expect(input).toHaveAttribute('dir', 'auto');
  fireEvent.change(input, { target: { value: 'تعديل تجريبي' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the edit');
  expect(input).toHaveValue('تعديل تجريبي');

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  expect(screen.getByRole('textbox', { name: 'Edit message' })).toHaveValue('النص المحفوظ');
});
