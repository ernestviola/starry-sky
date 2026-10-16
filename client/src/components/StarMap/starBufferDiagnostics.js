export const getStarBufferDropReport = (
  droppedStars,
  { bufferCount, maxStars, pendingStarCount },
) => {
  const dropsByFrame = new Map();

  for (const star of droppedStars) {
    const frameId = star.healpixId ?? 'unknown';
    dropsByFrame.set(frameId, (dropsByFrame.get(frameId) ?? 0) + 1);
  }

  return {
    bufferCount,
    maxStars,
    pendingStarCount,
    droppedCount: droppedStars.length,
    dropsByFrame: Object.fromEntries(dropsByFrame),
  };
};

export const isStarBufferDiagnosticsEnabled = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debugStarBuffer') === '1';
