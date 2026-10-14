import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import StarDetails from './index.jsx';

vi.mock('../../contexts/StarDataContext.jsx', () => ({
  useStarData: () => ({ starsDictionary: { 7: { id: 7, hip: 123, proper: 'Vega', mag: 0.03 } } }),
}));

test('selection alone does not open a persistent star details card', () => {
  render(<StarDetails hoveredStarId={null} selectedStarId={7} />);
  expect(screen.queryByText('Vega')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /star details/i })).not.toBeInTheDocument();
});
