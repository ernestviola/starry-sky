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

export const getStarRenderDiagnostic = (
  star,
  {
    bufferIndex,
    drawCount,
    bufferCapacity,
    size,
    fade,
    globalOpacity,
    color,
  },
) => ({
  starId: star?.id ?? null,
  frameId: star?.healpixId ?? null,
  magnitude: star?.mag ?? null,
  bufferIndex: bufferIndex ?? null,
  isInDrawRange:
    bufferIndex !== undefined && bufferIndex !== null && bufferIndex < drawCount,
  drawCount,
  bufferCapacity,
  size: size ?? null,
  fade: fade ?? null,
  globalOpacity: globalOpacity ?? null,
  effectiveOpacity:
    fade === null || fade === undefined ||
    globalOpacity === null || globalOpacity === undefined
      ? null
      : fade * globalOpacity,
  color: color ?? null,
});

export const isStarBufferDiagnosticsEnabled = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debugStarBuffer') === '1';
