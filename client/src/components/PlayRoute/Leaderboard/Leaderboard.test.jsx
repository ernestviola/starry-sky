import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import Leaderboard from './Leaderboard.jsx';

const responseFor = (body, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(body),
});

const leaderboard = {
  success: true,
  leaderboard: [
    { id: 7, rank: 1, name: 'Ada', totalTimeMiliseconds: 1234 },
  ],
  page: 1,
  hasNext: false,
};

const renderLeaderboard = (props = {}) =>
  render(
    <Leaderboard
      handleStartGame={vi.fn()}
      refreshLeaderboard={false}
      setRefreshLeaderboard={vi.fn()}
      {...props}
    />,
  );

beforeEach(() => {
  vi.stubEnv('VITE_STAR_API', 'https://api.example/');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor(leaderboard)));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('requests the leaderboard for the supplied leaderboardId', async () => {
  renderLeaderboard({ leaderboardId: 42 });

  await waitFor(() => expect(fetch).toHaveBeenCalled());

  const requestUrl = new URL(fetch.mock.calls[0][0]);
  expect(requestUrl.searchParams.get('leaderboardId')).toBe('42');
});

test('requests the global leaderboard when there is no leaderboardId', async () => {
  renderLeaderboard();

  await waitFor(() => expect(fetch).toHaveBeenCalled());

  const requestUrl = new URL(fetch.mock.calls[0][0]);
  expect(requestUrl.searchParams.has('leaderboardId')).toBe(false);
});

test('shows the initial page and disables both pagination paths when appropriate', async () => {
  renderLeaderboard();

  expect(screen.getByText('1')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Previous page', hidden: true }),
  ).toBeDisabled();

  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Next page', hidden: true }),
    ).toBeDisabled(),
  );
});

test('loads the next page when the next button is clicked', async () => {
  fetch
    .mockResolvedValueOnce(responseFor({ ...leaderboard, hasNext: true }))
    .mockResolvedValueOnce(responseFor({ ...leaderboard, page: 2 }));
  renderLeaderboard();

  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Next page', hidden: true }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Next page', hidden: true }),
  );

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  const requestUrl = new URL(fetch.mock.calls[1][0]);
  expect(requestUrl.searchParams.get('page')).toBe('2');
});

test('retry calls the expected game start behavior', () => {
  const handleStartGame = vi.fn();
  renderLeaderboard({ handleStartGame });

  fireEvent.click(screen.getByTitle('retry'));

  expect(handleStartGame).toHaveBeenCalledOnce();
});

test('has no rows before the leaderboard fetch resolves', () => {
  fetch.mockReturnValueOnce(new Promise(() => {}));
  renderLeaderboard();

  expect(screen.queryByText('Ada')).not.toBeInTheDocument();
});

test('renders the returned leaderboard data after fetch', async () => {
  renderLeaderboard();

  expect(await screen.findByText('Ada')).toBeInTheDocument();
  expect(screen.getByText('1.23s')).toBeInTheDocument();
});

test('does not crash when the leaderboard fetch fails', async () => {
  fetch.mockResolvedValueOnce(responseFor({}, false));
  renderLeaderboard();

  expect(
    await screen.findByRole('alert', { hidden: true }),
  ).toHaveTextContent('Unable to load leaderboard.');
});
