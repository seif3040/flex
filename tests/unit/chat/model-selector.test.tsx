import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ModelSelector } from '@/components/chat/ModelSelector';
import type { NormalizedModel } from '@/lib/openrouter/types';

function model(id: string, name: string, isFree: boolean): NormalizedModel {
  return { id, name, isFree, contextWindow: 4096, pricing: { prompt: '0', completion: '0' }, supportsVision: false, supportsTools: false, description: '' };
}

it('searches free models by identifier and returns the selected model', () => {
  const onChange = vi.fn();
  render(<ModelSelector value="openrouter/free" onChange={onChange} models={[
    model('demo/alpha:free', 'Alpha', true),
    model('demo/beta:free', 'Beta', true),
    model('demo/paid', 'Paid', false),
  ]} />);

  fireEvent.click(screen.getByRole('button', { name: 'Model: Auto · Free' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.queryByText('demo/paid')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'demo/beta' } });
  expect(screen.queryByText('demo/alpha:free')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Beta/ }));
  expect(onChange).toHaveBeenCalledExactlyOnceWith('demo/beta:free');
});
