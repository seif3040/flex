import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WelcomePrompt, WELCOME_DRAFT_KEY } from '@/components/chat/WelcomePrompt';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

it('keeps the welcome prompt in tab storage and navigates without putting it in the URL', () => {
  render(<WelcomePrompt />);
  const continueButton = screen.getByRole('button', { name: 'Continue to chat' });
  expect(continueButton).toBeDisabled();

  fireEvent.change(screen.getByRole('textbox', { name: 'Ask Flex anything' }), {
    target: { value: '  لخص الملف  ' },
  });
  fireEvent.click(continueButton);

  expect(sessionStorage.getItem(WELCOME_DRAFT_KEY)).toBe('لخص الملف');
  expect(push).toHaveBeenCalledExactlyOnceWith('/c/new');
});
