import { act, render, screen } from '@testing-library/react';
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

test('total time count increases', () => {
  vi.useFakeTimers();

  const startTime = 1000;
  vi.setSystemTime(startTime);

  render(<GameTimer startTime={startTime} />);

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  const firstTime = screen.getByRole('timer').textContent;

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  const secondTime = screen.getByRole('timer').textContent;

  expect(firstTime).toBe('1.00s');
  expect(secondTime).toBe('2.00s');
});

test('does the component unmount correctly', () => {
  const { unmount } = render(<GameTimer startTime={1000} />);

  expect(screen.getByRole('timer')).toBeInTheDocument();

  unmount();

  expect(screen.queryByRole('timer')).not.toBeInTheDocument();
});

test('does it preserve its style', () => {
  const style = {
    color: 'rgb(255,0,0)',
  };

  render(<GameTimer startTime={1000} style={style} />);

  const timer = screen.getByRole('timer');

  expect(timer).toHaveStyle({
    color: 'rgb(255,0,0)',
  });
});
