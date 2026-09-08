import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import GameTimer from './GameTimer.jsx';

test('displays the completed game time', () => {
  render(<GameTimer totalTime={2500} />);

  expect(screen.getByText('2.50s')).toBeInTheDocument();
});

test('game timer is absent when it has no start time', () => {
  render(<GameTimer />);

  const timer = screen.queryByRole('timer');

  expect(timer).not.toBeInTheDocument();
});

test.todo('does total time count increase?');
test.todo('does the component unmount correctly');
test.todo('does it preserve its style');
