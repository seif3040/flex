import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WorkspaceManager } from '@/components/settings/WorkspaceManager';

afterEach(() => vi.unstubAllGlobals());

it.each([
  ['projects', 'New project', 'Unable to save project.'],
  ['memory', 'A preference to remember', 'Unable to save memory.'],
] as const)('preserves input when saving %s fails', async (section, placeholder, message) => {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) =>
    options?.method === 'POST'
      ? new Response(null, { status: 500 })
      : Response.json({ data: { projects: [], entries: [] } })
  ));

  render(<WorkspaceManager section={section} />);
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value: 'تجربة الحفظ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(input).toHaveValue('تجربة الحفظ');
});
