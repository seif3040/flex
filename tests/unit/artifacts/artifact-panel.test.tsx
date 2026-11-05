import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ArtifactPanel } from '@/components/artifact/ArtifactPanel';

it('previews the edited HTML in a sandbox and preserves the draft when returning to code', () => {
  render(<ArtifactPanel id="test" title="Sample" language="html" initialContent="<h1>Original</h1>" onClose={vi.fn()} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Artifact code' }), { target: { value: '<h1>Updated</h1>' } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  const frame = screen.getByTitle('Artifact preview');
  expect(frame).toHaveAttribute('sandbox', '');
  expect(frame.getAttribute('srcdoc')).toContain('<h1>Updated</h1>');
  fireEvent.click(screen.getByRole('button', { name: 'Code' }));
  expect(screen.getByRole('textbox', { name: 'Artifact code' })).toHaveValue('<h1>Updated</h1>');
});
