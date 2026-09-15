import 'dotenv/config';
import { mkdir, rm, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../libs/prisma.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = resolve(
  projectRoot,
  'client/public/data/constellations',
);

const writeJson = async (path, value) => {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporaryPath, path);
};

try {
  const lines = await prisma.constellation.findMany({
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
      star: {
        select: {
          decrad: true,
          rarad: true,
        },
      },
    },
  });

  const namesByFrame = new Map();
  const linesByName = new Map();

  for (const line of lines) {
    const nameLines = linesByName.get(line.constellationName) ?? [];
    nameLines.push(line);
    linesByName.set(line.constellationName, nameLines);

    if (line.healpixId === null) continue;
    const frameNames = namesByFrame.get(line.healpixId) ?? new Set();
    frameNames.add(line.constellationName);
    namesByFrame.set(line.healpixId, frameNames);
  }

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(resolve(outputDirectory, 'frames'), { recursive: true });
  await mkdir(resolve(outputDirectory, 'by-name'), { recursive: true });

  const constellationFiles = {};
  for (const [name, nameLines] of linesByName) {
    const filename = `${encodeURIComponent(name)}.json`;
    constellationFiles[name] = `by-name/${filename}`;
    await writeJson(resolve(outputDirectory, 'by-name', filename), {
      constellationName: name,
      constellationLines: nameLines,
    });
  }

  for (const [healpixId, frameNames] of namesByFrame) {
    await writeJson(resolve(outputDirectory, 'frames', `frame-${healpixId}.json`), {
      constellations: [...frameNames].sort(),
    });
  }

  await writeJson(resolve(outputDirectory, 'index.json'), {
    constellationFiles,
  });

  console.log(
    `Wrote ${lines.length} lines for ${linesByName.size} constellations across ${namesByFrame.size} HEALPix files in ${outputDirectory}`,
  );
} finally {
  await prisma.$disconnect();
}
