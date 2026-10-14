export const getStarClickIndicatorColor = (status) => {
  if (status === 'correct') return '#8fe3b0';
  if (status === 'incorrect') return '#ff8f9f';
  return '#fff';
};

export const getStarClickIndicatorOpacity = (
  expiresAt,
  now = performance.now(),
  duration = 300,
) => {
  if (expiresAt === null || expiresAt === undefined) return 1;
  if (duration <= 0) return 0;
  const remaining = Math.max(0, Math.min((expiresAt - now) / duration, 1));
  return remaining * remaining;
};
