import 'dotenv/config';
import { mkdir, rm, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../libs/prisma.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = resolve(projectRoot, 'client/public/data/stars');

try {
  const stars = await prisma.hygStar.findMany({
    orderBy: [{ healpixId: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      hip: true,
      healpixId: true,
      rarad: true,
      decrad: true,
      x: true,
      y: true,
      z: true,
      ci: true,
      mag: true,
      proper: true,
      con: true,
    },
  });

  const starsByFrame = new Map();
  for (const star of stars) {
    if (star.healpixId === null) continue;

    const frameStars = starsByFrame.get(star.healpixId) ?? [];
    frameStars.push(star);
    starsByFrame.set(star.healpixId, frameStars);
  }

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  for (const [healpixId, frameStars] of starsByFrame) {
    const outputPath = resolve(outputDirectory, `frame-${healpixId}.json`);
    const temporaryPath = `${outputPath}.tmp`;

    await writeFile(
      temporaryPath,
      `${JSON.stringify({ frameIds: [healpixId], stars: frameStars }, null, 2)}\n`,
    );
    await rename(temporaryPath, outputPath);
  }

  console.log(
    `Wrote ${stars.length} stars to ${starsByFrame.size} HEALPix files in ${outputDirectory}`,
  );
} finally {
  await prisma.$disconnect();
}
