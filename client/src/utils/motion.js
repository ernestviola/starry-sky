export const getMotionDuration = (tokenName, fallbackMs = 300) => {
  const tokenValue = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim();
  const match = tokenValue.match(/^([\d.]+)\s*(ms|s)$/);
  if (!match) return fallbackMs;

  const duration = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(duration) ? duration : fallbackMs;
};
