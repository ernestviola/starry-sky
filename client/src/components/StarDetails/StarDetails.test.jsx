import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import StarDetails from './index.jsx';

vi.mock('../../contexts/StarDataContext.jsx', () => ({
  useStarData: () => ({ starsDictionary: { 7: { id: 7, hip: 123, proper: 'Vega', mag: 0.03 } } }),
}));

test('selected star details persist until dismissed', () => {
  const onClose = vi.fn();
  render(<StarDetails hoveredStarId={null} selectedStarId={7} onClose={onClose} />);
  const details = screen.getByRole('region', { name: 'Selected star details' });
  expect(details).toHaveTextContent('Vega');
  expect(details).toHaveTextContent('123');
  fireEvent.click(screen.getByRole('button', { name: 'Close star details' }));
  expect(onClose).toHaveBeenCalledOnce();
});
