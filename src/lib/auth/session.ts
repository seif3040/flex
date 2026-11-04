import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Retrieves the currently authenticated Supabase user on the server.
 * Returns null if no active or valid session exists.
 *
 * Uses supabase.auth.getUser() to verify the JWT authenticity against the auth server.
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated Supabase user on the server.
 * Alias for getServerUser fulfilling the docs/IMPLEMENTATION_PLAN.md P03-T03 specification.
 */
export async function getServerSession(): Promise<User | null> {
  return getServerUser();
}

/**
 * Asserts that a user is authenticated on the server.
 * Throws an UnauthorizedError if no authenticated user is present.
 */
export async function requireServerUser(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

/**
 * Generates a standard JSON 401 Unauthorized response adhering to docs/API_CONTRACTS.md.
 */
export function createUnauthorizedResponse(
  message = 'Authentication required. Please sign in.'
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status: 401 }
  );
}
