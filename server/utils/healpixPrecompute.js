import { prisma } from '../libs/prisma.js';
import * as healpix from '@hscmap/healpix';

const stars = await prisma.hygStar.findMany();
const chunkSize = 50;

console.log('Number of stars', stars.length);

for (let i = 0; i < stars.length; i += chunkSize) {
  const chunk = stars.slice(i, i + chunkSize);
  const chunkPromises = chunk.map((star) => {
    if (!star.rarad || !star.decrad) return;
    const theta = Math.PI / 2 - star.decrad;
    const phi = star.rarad;

    const healpixId = healpix.ang2pix_ring(8, theta, phi);

    return prisma.hygStar.update({
      where: { id: star.id },
      data: { healpixId },
    });
  });

  await Promise.all(chunkPromises);
  console.log(`Processed ${i + chunk.length} / ${stars.length}`);
}
