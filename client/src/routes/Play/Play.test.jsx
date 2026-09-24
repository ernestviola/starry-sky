import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import Play from './Play.jsx';

vi.mock('../../contexts/StarMapContext.jsx', () => ({
  useStarMap: () => ({
    hoveredStarId: null,
    registerClickHandler: vi.fn(() => vi.fn()),
  }),
}));

vi.mock('../../components/PlayRoute/Leaderboard/Leaderboard.jsx', () => ({
  default: () => null,
}));

vi.mock('../../components/PlayRoute/SubmitScore/SubmitScore.jsx', () => ({
  default: () => null,
}));

vi.mock('../../components/PlayRoute/GameTimer/GameTimer.jsx', () => ({
  default: () => null,
}));

vi.mock('../../components/SearchList/SearchList.jsx', () => ({
  default: () => null,
}));

const NavigateAway = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/about')}>Leave play</button>;
};

const originalDialogDescriptors = {
  show: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'show'),
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close'),
};

beforeAll(() => {
  HTMLDialogElement.prototype.show = vi.fn(function show() {
    this.open = true;
  });
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close() {
    this.open = false;
  });
});

afterAll(() => {
  for (const [method, descriptor] of Object.entries(originalDialogDescriptors)) {
    if (descriptor) {
      Object.defineProperty(HTMLDialogElement.prototype, method, descriptor);
    } else {
      delete HTMLDialogElement.prototype[method];
    }
  }
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});

describe('Play dialog flow', () => {
  test('unmounts an open modeless dialog when navigating away', async () => {
    render(
      <MemoryRouter initialEntries={['/play']}>
        <Routes>
          <Route
            path='/play'
            element={
              <>
                <Play />
                <NavigateAway />
              </>
            }
          />
          <Route path='/about' element={<p>About</p>} />
        </Routes>
      </MemoryRouter>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.open).toBe(true);
    expect(HTMLDialogElement.prototype.show).toHaveBeenCalled();
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Leave play' }));

    expect(await screen.findByText('About')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes immediately in reduced motion and invokes the next-dialog callback', () => {
    window.matchMedia.mockReturnValue({ matches: true });

    render(<Play />);

    const gameDialog = screen.getByRole('dialog');
    const addEventListener = vi.spyOn(gameDialog, 'addEventListener');

    fireEvent.click(screen.getByRole('button', { name: 'How to play' }));

    expect(
      screen.getByRole('heading', { name: 'How to play' }),
    ).toBeInTheDocument();
    expect(
      addEventListener.mock.calls.some(([event]) => event === 'animationend'),
    ).toBe(false);
    expect(screen.getByRole('dialog').open).toBe(true);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('heading', { name: 'Find The Stars!' })).toBeInTheDocument();
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(2);
  });
});
