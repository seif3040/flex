import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '@/lib/validation/auth';

describe('Auth Validation Schemas (Zod)', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPassword123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('normalizes email by trimming and converting to lowercase', () => {
      const result = loginSchema.safeParse({
        email: '  USER@Example.COM  ',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = ['', 'notanemail', 'user@', '@domain.com', 'user@domain'];
      for (const email of invalidEmails) {
        const result = loginSchema.safeParse({ email, password: 'password123' });
        expect(result.success).toBe(false);
      }
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/password is required/i);
      }
    });
  });

  describe('signupSchema', () => {
    const validData = {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'StrongPassword1',
      confirmPassword: 'StrongPassword1',
    };

    it('accepts valid signup input with strong password and matching confirmation', () => {
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts empty or omitted fullName', () => {
      const result = signupSchema.safeParse({
        ...validData,
        fullName: '',
      });
      expect(result.success).toBe(true);
    });

    it('enforces password minimum length of 8 characters', () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: 'Pass1',
        confirmPassword: 'Pass1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toMatch(/at least 8 characters/i);
      }
    });

    it('enforces at least one uppercase letter in password', () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: 'lowercaseonly1',
        confirmPassword: 'lowercaseonly1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('password'));
        expect(issue?.message).toMatch(/uppercase letter/i);
      }
    });

    it('enforces at least one lowercase letter in password', () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: 'UPPERCASEONLY1',
        confirmPassword: 'UPPERCASEONLY1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('password'));
        expect(issue?.message).toMatch(/lowercase letter/i);
      }
    });

    it('enforces at least one number in password', () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: 'NoNumbersInPassword',
        confirmPassword: 'NoNumbersInPassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('password'));
        expect(issue?.message).toMatch(/number/i);
      }
    });

    it('fails when confirmPassword does not match password', () => {
      const result = signupSchema.safeParse({
        ...validData,
        password: 'StrongPassword1',
        confirmPassword: 'DifferentPassword1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((i) =>
          i.path.includes('confirmPassword')
        );
        expect(confirmError?.message).toBe('Passwords do not match');
      }
    });
  });
});
