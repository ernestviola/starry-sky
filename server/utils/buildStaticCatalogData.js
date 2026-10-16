import 'dotenv/config';
import { gzipSync } from 'node:zlib';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ang2pix_nest, pix2ang_ring } from '@hscmap/healpix';
import { nside } from '../../client/src/components/StarMap/config.js';
import { prisma } from '../libs/prisma.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dataDirectory = resolve(projectRoot, 'client/public/data');
const starDirectory = resolve(dataDirectory, 'stars');
const constellationDirectory = resolve(dataDirectory, 'constellations');
const frameCount = 12 * nside * nside;
const bundleNside = 4;
const bundleCount = 12 * bundleNside * bundleNside;

const writeGzipJson = async (path, value) => {
  const temporaryPath = `${path}.tmp`;
  const compressed = gzipSync(Buffer.from(JSON.stringify(value)), { level: 9 });
  await writeFile(temporaryPath, compressed);
  await rename(temporaryPath, path);
};

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

  const starsByFrame = Array.from({ length: frameCount }, () => []);
  for (const star of stars) {
    if (Number.isInteger(star.healpixId) && starsByFrame[star.healpixId]) {
      starsByFrame[star.healpixId].push(star);
    }
  }

  await mkdir(starDirectory, { recursive: true });
  const starsByBundle = Array.from({ length: bundleCount }, () => ({}));
  for (let frameId = 0; frameId < frameCount; frameId += 1) {
    const { theta, phi } = pix2ang_ring(nside, frameId);
    const bundleId = ang2pix_nest(bundleNside, theta, phi);
    starsByBundle[bundleId][frameId] = starsByFrame[frameId];
  }

  for (let bundleId = 0; bundleId < bundleCount; bundleId += 1) {
    await writeGzipJson(
      resolve(starDirectory, `region-${bundleId}.json.gz`),
      { frames: starsByBundle[bundleId] },
    );
  }

  for (const filename of await readdir(starDirectory)) {
    if (/^(?:chunk|region)-\d+\.json\.gz$/.test(filename)) {
      const match = filename.match(/^region-(\d+)\.json\.gz$/);
      if (!match || Number(match[1]) >= bundleCount) {
        await rm(resolve(starDirectory, filename));
      }
    }
  }

  const constellationLines = await prisma.constellation.findMany({
    orderBy: [
      { constellationName: 'asc' },
      { lineIndex: 'asc' },
      { pointIndex: 'asc' },
    ],
    select: {
      id: true,
      constellationName: true,
      lineIndex: true,
      pointIndex: true,
      healpixId: true,
      star: { select: { decrad: true, rarad: true } },
    },
  });

  const constellationsByFrame = Array.from({ length: frameCount }, () => new Set());
  const constellationLinesByName = {};
  for (const line of constellationLines) {
    (constellationLinesByName[line.constellationName] ??= []).push(line);
    if (Number.isInteger(line.healpixId) && constellationsByFrame[line.healpixId]) {
      constellationsByFrame[line.healpixId].add(line.constellationName);
    }
  }

  await mkdir(constellationDirectory, { recursive: true });
  await writeGzipJson(
    resolve(constellationDirectory, 'catalog.json.gz'),
    {
      constellationsByFrame: Object.fromEntries(
        constellationsByFrame.map((names, frameId) => [frameId, [...names].sort()]),
      ),
      constellationLinesByName,
    },
  );

  console.log(
    `Wrote ${stars.length} stars in ${bundleCount} compressed regional bundles and ${constellationLines.length} constellation points.`,
  );
} finally {
  await prisma.$disconnect();
}
