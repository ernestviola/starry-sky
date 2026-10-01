import { fireEvent, render, screen } from '@testing-library/react';
import { StarMapProvider, useStarMap } from './StarMapContext.jsx';

const Probe = () => {
  const { selectedStarId, setSelectedStarId } = useStarMap();
  return (
    <>
      <output aria-label='selection'>{selectedStarId ?? 'none'}</output>
      <button onClick={() => setSelectedStarId('123')}>select</button>
      <button onClick={() => setSelectedStarId(null)}>dismiss</button>
    </>
  );
};

test('stores, replaces, and dismisses a selected star', () => {
  render(
    <StarMapProvider>
      <Probe />
    </StarMapProvider>,
  );

  const selection = () => screen.getByRole('status', { name: 'selection' });
  expect(selection()).toHaveTextContent('none');
  fireEvent.click(screen.getByRole('button', { name: 'select' }));
  expect(selection()).toHaveTextContent('123');
  fireEvent.click(screen.getByRole('button', { name: 'dismiss' }));
  expect(selection()).toHaveTextContent('none');
});
