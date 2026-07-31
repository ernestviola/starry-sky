const toRad = (deg) => {
  return (Math.PI * deg) / 180;
};

const getX = (ra, dec) => {
  const rad_ra = toRad(ra);
  const rad_dec = toRad(dec);
  return Math.cos(rad_ra) * Math.cos(rad_dec);
};

const getY = (ra, dec) => {
  const rad_ra = toRad(ra);
  const rad_dec = toRad(dec);

  return Math.sin(rad_ra) * Math.cos(rad_dec);
};

const getZ = (ra, dec) => {
  const rad_dec = toRad(dec);
  return Math.sin(rad_dec);
};

const ra = 90;
const dec = 140;

const x = getX(ra, dec);
const y = getY(ra, dec);
const z = getZ(ra, dec);

console.log({ x, y, z });

const isOnUnitSphere = Math.abs(x * x + y * y + z * z - 1) < 1e-10;

console.log('Check', isOnUnitSphere);
console.log('Sum', x * x + y * y + z * z);
