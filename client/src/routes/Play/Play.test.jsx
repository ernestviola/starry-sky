import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import Play from './Play.jsx';

const mapMock = vi.hoisted(() => ({ interactionHandler: null, clickHandler: null, setStarClickFeedback: vi.fn() }));

vi.mock('../../contexts/StarMapContext.jsx', () => ({
  useStarMap: () => ({
    hoveredStarId: null,
    registerClickHandler: vi.fn((handler) => {
      mapMock.clickHandler = handler;
      return () => {
        if (mapMock.clickHandler === handler) mapMock.clickHandler = null;
      };
    }),
    registerInteractionHandler: vi.fn((handler) => {
      mapMock.interactionHandler = handler;
      return () => {
        if (mapMock.interactionHandler === handler) mapMock.interactionHandler = null;
      };
    }),
    setStarClickFeedback: mapMock.setStarClickFeedback,
  }),
}));

vi.mock('../../components/PlayRoute/GameTimer/GameTimer.jsx', () => ({
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
  mapMock.interactionHandler = null;
  mapMock.clickHandler = null;
  mapMock.setStarClickFeedback.mockClear();
  vi.stubEnv('VITE_STAR_API', 'http://api.test/');
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

  test('desktop stars remain expanded through map interactions', async () => {
    const token = `eyJhbGciOiJub25lIn0.${btoa(
      JSON.stringify({ startTime: 1000, starsToFind: [] }),
    )}.signature`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token }),
    }));

    render(<Play />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(await screen.findByRole('list', { name: 'Stars to find!' })).toBeVisible();
    expect(mapMock.interactionHandler).toEqual(expect.any(Function));

    await act(async () => mapMock.interactionHandler('drag'));
    expect(screen.getByRole('list', { name: 'Stars to find!' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /stars/i })).not.toBeInTheDocument();


    act(() => mapMock.interactionHandler('zoom'));
    expect(screen.getByRole('list', { name: 'Stars to find!' })).toBeVisible();
  });

  test('mobile header toggles by keyboard and collapses once on map interaction', async () => {
    window.matchMedia.mockImplementation(query => ({ matches: query.includes('max-width') }));
    const token = `eyJhbGciOiJub25lIn0.${btoa(
      JSON.stringify({ startTime: 1000, starsToFind: [] }),
    )}.signature`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token }),
    }));

    render(<Play />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('list', { name: 'Stars to find!' })).toBeVisible();

    act(() => mapMock.interactionHandler('blank'));
    expect(screen.getByRole('list', { name: 'Stars to find!' })).toBeVisible();
    const header = screen.getByRole('button', { name: 'Collapse stars' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    await act(async () => mapMock.interactionHandler('drag'));
    expect(screen.getByRole('button', { name: 'Expand stars' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    act(() => mapMock.interactionHandler('zoom'));
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  test('changes the sole modeless dialog without waiting for animation in reduced motion', () => {
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
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('heading', { name: 'Find the stars!' })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});

describe('Play star click feedback', () => {
  test('sets red model feedback for an incorrect star and green model feedback for a target star', async () => {
    const token = `eyJhbGciOiJub25lIn0.${btoa(
      JSON.stringify({
        startTime: 1000,
        starsToFind: [
          { id: 'target-1', proper: 'Vega' },
          { id: 'target-2', proper: 'Altair' },
        ],
      }),
    )}.signature`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token }),
    }));

    render(<Play />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('list', { name: 'Stars to find!' })).toBeVisible();

    act(() => mapMock.clickHandler('unrelated-star'));
    expect(mapMock.setStarClickFeedback).toHaveBeenLastCalledWith(expect.objectContaining({
      starId: 'unrelated-star',
      status: 'incorrect',
      expiresAt: expect.any(Number),
      duration: expect.any(Number),
    }));

    act(() => mapMock.clickHandler('target-1'));
    expect(mapMock.setStarClickFeedback).toHaveBeenLastCalledWith(expect.objectContaining({
      starId: 'target-1',
      status: 'correct',
      expiresAt: expect.any(Number),
      duration: expect.any(Number),
    }));
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });
});

const tokenFor = data => `e30.${btoa(JSON.stringify(data))}.signature`;
const startData = { startTime: Date.now(), starsToFind: [{ id: 'sirius', proper: 'Sirius' }, { id: 'polaris', proper: 'Polaris' }] };
const gameResponse = data => ({ ok: true, json: async () => data });
const startAndFinish = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Start', exact: true }));
  await screen.findByRole('region', { name: 'Game status' });
  act(() => mapMock.clickHandler('sirius'));
  act(() => mapMock.clickHandler('polaris'));
};

describe('Play results and request recovery', () => {
  test('hides gameplay, submits once, shows only leaderboard, and resets on replay', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async url => {
      if (String(url).endsWith('/start')) return gameResponse({ token: tokenFor(startData) });
      if (String(url).endsWith('/submit')) return gameResponse({ token: tokenFor({ totalTime: 12000 }) });
      if (String(url).endsWith('/name')) return gameResponse({ success: true, leaderboardId: 7 });
      return gameResponse({ leaderboard: [{ id: 7, rank: 1, name: 'Ada', totalTimeMiliseconds: 12000 }], page: 1, hasNext: false });
    }));
    render(<Play />);
    await startAndFinish();
    await screen.findByRole('dialog', { name: 'Submit your time' });
    expect(screen.queryByRole('region', { name: 'Game status' })).not.toBeInTheDocument();
    act(() => mapMock.clickHandler('sirius'));
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/submit'))).toHaveLength(1);
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit', exact: true }));
    await screen.findByRole('dialog', { name: 'Leaderboard' });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    act(() => mapMock.clickHandler('polaris'));
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/submit'))).toHaveLength(1);
    await waitFor(() => expect(screen.getByRole('button', { name: /Play again/ })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /Play again/ }));
    await screen.findByRole('region', { name: 'Game status' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('0/2')).toBeInTheDocument();
  });

  test('disables duplicate start requests and exposes a retryable error', async () => {
    let resolve;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(done => { resolve = done; })));
    render(<Play />);
    fireEvent.click(screen.getByRole('button', { name: 'Start', exact: true }));
    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Starting…' }));
    expect(fetch).toHaveBeenCalledOnce();
    await act(async () => resolve({ ok: false }));
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to start');
    expect(screen.getByRole('button', { name: 'Start', exact: true })).toBeEnabled();
  });

  test('completion failure keeps gameplay inactive and supports retry', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(gameResponse({ token: tokenFor(startData) }))
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce(gameResponse({ token: tokenFor({ totalTime: 12000 }) })));
    render(<Play />);
    await startAndFinish();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to calculate');
    expect(screen.queryByRole('region', { name: 'Game status' })).not.toBeInTheDocument();
    act(() => mapMock.clickHandler('sirius'));
    expect(fetch).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Retry calculation' }));
    await screen.findByRole('dialog', { name: 'Submit your time' });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('failed score submission preserves the name and allows retry without duplicate requests', async () => {
    let resolve;
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(gameResponse({ token: tokenFor(startData) }))
      .mockResolvedValueOnce(gameResponse({ token: tokenFor({ totalTime: 12000 }) }))
      .mockImplementationOnce(() => new Promise(done => { resolve = done; })));
    render(<Play />);
    await startAndFinish();
    await screen.findByRole('dialog', { name: 'Submit your time' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit', exact: true }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Saving…' }));
    expect(fetch).toHaveBeenCalledTimes(3);
    await act(async () => resolve({ ok: false }));
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to save');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
    expect(screen.getByRole('button', { name: 'Submit', exact: true })).toBeEnabled();
  });
});
