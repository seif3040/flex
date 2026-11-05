import { expect, it, vi } from 'vitest';
import { POST } from '@/app/api/conversations/route';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from }) }));
vi.mock('@/lib/auth/session', () => ({ requireServerUser: async () => ({ id: 'current-user' }) }));

it('rejects an inaccessible project before writing a conversation', async () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  from.mockReturnValue(query);
  const projectId = '00000000-0000-4000-8000-000000000001';
  const response = await POST(new Request('http://localhost/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ modelId: 'openrouter/free', projectId }),
  }));

  expect(response.status).toBe(403);
  expect(query.eq).toHaveBeenCalledWith('id', projectId);
  expect(query.eq).toHaveBeenCalledWith('user_id', 'current-user');
  expect(from).toHaveBeenCalledExactlyOnceWith('projects');
});
