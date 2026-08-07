import { prisma } from '../libs/prisma.js';
import { nside } from '../config.js';
import * as healpix from '@hscmap/healpix';

const constellationLines = await prisma.constellationLine.findMany();
const chunkSize = 50;

console.log('Number of constellation lines', constellationLines.length);

for (let i = 0; i < constellationLines.length; i += chunkSize) {
  const chunk = constellationLines.slice(i, i + chunkSize);
  const chunkPromises = chunk.map((constellationLine) => {
    if (!constellationLine.rarad || !constellationLine.decrad) return;
    const theta = Math.PI / 2 - constellationLine.decrad;
    const phi = constellationLine.rarad;

    const healpixId = healpix.ang2pix_ring(nside, theta, phi);

    return prisma.constellationLine.update({
      where: { id: constellationLine.id },
      data: { healpixId },
    });
  });

  await Promise.all(chunkPromises);
  console.log(`Processed ${i + chunk.length} / ${constellationLines.length}`);
}
