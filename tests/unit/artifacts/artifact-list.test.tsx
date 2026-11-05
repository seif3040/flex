import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ArtifactList } from '@/components/artifact/ArtifactList';

afterEach(() => vi.unstubAllGlobals());

it('opens saved HTML from the workspace list in an isolated preview', async () => {
  const content = '<h1>Flex preview</h1>';
  const fetchArtifacts = vi.fn().mockResolvedValue(Response.json({
    data: { artifacts: [{ id: 'test', title: 'Example', language: 'html', content, version: 1 }] },
  }));
  vi.stubGlobal('fetch', fetchArtifacts);
  render(<ArtifactList />);

  fireEvent.click(await screen.findByRole('button', { name: /Example/ }));
  expect(fetchArtifacts).toHaveBeenCalledWith('/api/artifacts', expect.anything());
  expect(screen.getByRole('textbox', { name: 'Artifact code' })).toHaveValue(content);
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  const preview = screen.getByTitle('Artifact preview');
  expect(preview).toHaveAttribute('sandbox', '');
  expect(preview.getAttribute('srcdoc')).toContain(content);
});
