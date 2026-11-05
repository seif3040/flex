import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Create an account — flex',
  description: 'Create your account to start chatting with state-of-the-art AI models.',
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-linear-to-b from-background to-muted/30">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">flex</span>
        </Link>

        <React.Suspense
          fallback={
            <div className="w-full max-w-md h-96 rounded-xl border border-border/50 bg-card/50 animate-pulse" />
          }
        >
          <SignupForm />
        </React.Suspense>
      </div>
    </main>
  );
}
