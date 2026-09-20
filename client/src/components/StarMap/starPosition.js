export const getStarPosition = (decrad, rarad) => ({
  x: Math.cos(decrad) * Math.sin(rarad),
  y: Math.sin(decrad),
  z: Math.cos(decrad) * Math.cos(rarad),
});
