import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import GameTimer from './GameTimer.jsx';

test('displays the completed game time', () => {
  render(<GameTimer totalTime={2500} />);

  expect(screen.getByText('2.50s')).toBeInTheDocument();
});
