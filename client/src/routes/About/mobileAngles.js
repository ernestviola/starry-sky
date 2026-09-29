export const mobileAngles = (step, progress = 0) => {
  if (step === 1) return { declination: Math.PI / 2 - Math.PI * progress, rightAscension: 0 };
  if (step === 2) {
    // Finish the full sweep, then return to the equator before RA begins.
    const declination = progress < 0.85
      ? -Math.PI / 2 + Math.PI * progress / 0.85
      : (Math.PI / 2) * (1 - progress) / 0.15;
    return { declination, rightAscension: 0 };
  }
  if (step === 3 || step === 4) return { declination: 0, rightAscension: 2 * Math.PI * progress };
  if (step === 5) return { declination: Math.PI / 6, rightAscension: Math.PI / 4 };
  return { declination: step === 0 ? Math.PI / 2 : 0, rightAscension: 0 };
};
