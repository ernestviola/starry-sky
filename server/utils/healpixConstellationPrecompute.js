import { prisma } from '../libs/prisma.js';

const constellationLines = await prisma.constellation.findMany({
  include: { star: true },
});
const chunkSize = 50;

console.log('Number of constellation lines', constellationLines.length);

console.log(constellationLines);

for (let i = 0; i < constellationLines.length; i += chunkSize) {
  const chunk = constellationLines.slice(i, i + chunkSize);
  const chunkPromises = chunk.map((constellation) => {
    return prisma.constellation.update({
      where: { id: constellation.id },
      data: { healpixId: constellation.star.healpixId },
    });
  });

  await Promise.all(chunkPromises);
  console.log(`Processed ${i + chunk.length} / ${constellationLines.length}`);
}
