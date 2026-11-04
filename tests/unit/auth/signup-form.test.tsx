import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { SignupForm } from '@/components/auth/signup-form';
import * as clientSupabase from '@/lib/supabase/client';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('SignupForm Component (Mocked Auth)', () => {
  const signUpMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();

    vi.mocked(clientSupabase.createClient).mockReturnValue({
      auth: {
        signUp: signUpMock,
      },
    } as unknown as ReturnType<typeof clientSupabase.createClient>);
  });

  it('renders all form fields, submit button, and sign in link', () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('preserves next parameter in sign in link if present', () => {
    mockSearchParams = new URLSearchParams({ next: '/projects/p1' });
    render(<SignupForm />);

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login?next=%2Fprojects%2Fp1'
    );
  });

  it('displays validation error if passwords do not match', async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: 'DifferentPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('displays validation error if password does not meet complexity rules', async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'simple' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: 'simple' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/at least 8 characters long/i)
      ).toBeInTheDocument();
    });

    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('displays user-friendly error when email already exists', async () => {
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: 'StrongPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/account with this email address already exists/i)
      ).toBeInTheDocument();
    });
  });

  it('renders email verification screen when email confirmation is required', async () => {
    signUpMock.mockResolvedValue({
      data: {
        user: { id: 'new-user-id', email: 'ada@example.com' },
        session: null, // No session indicates confirmation email sent
      },
      error: null,
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: 'StrongPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText('ada@example.com')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /proceed to sign in/i })
      ).toBeInTheDocument();
    });

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        password: 'StrongPass1',
        options: expect.objectContaining({
          data: { full_name: 'Ada Lovelace' },
        }),
      })
    );
  });

  it('redirects to destination immediately if session is returned on signup', async () => {
    mockSearchParams = new URLSearchParams({ next: '/c/123' });

    signUpMock.mockResolvedValue({
      data: {
        user: { id: 'new-user-id' },
        session: { access_token: 'valid-token' },
      },
      error: null,
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'instant@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: 'StrongPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/c/123');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('toggles password and confirm password visibility', () => {
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    const togglePasswordBtn = screen.getByRole('button', {
      name: /^show password$/i,
    });
    fireEvent.click(togglePasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const toggleConfirmBtn = screen.getByRole('button', {
      name: /show confirm password/i,
    });
    fireEvent.click(toggleConfirmBtn);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });
});
