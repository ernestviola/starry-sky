import { prisma } from '../libs/prisma.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

const toRarad = (lon) => {
  const deg = lon < 0 ? lon + 360 : lon;
  return (deg * Math.PI) / 180;
};

const toDecrad = (lat) => (lat * Math.PI) / 180;

const raw = await fs.readFile(
  path.join(os.homedir(), '/Downloads/data/constellations.lines.json'),
  'utf-8',
);
const geojson = JSON.parse(raw);

const rows = [];

for (const feature of geojson.features) {
  const constellation = feature.id;
  const segments = feature.geometry.coordinates;

  segments.forEach((segment, segmentIndex) => {
    segment.forEach(([lon, lat], pointIndex) => {
      rows.push({
        constellation,
        segmentIndex,
        pointIndex,
        rarad: toRarad(lon),
        decrad: toDecrad(lat),
      });
    });
  });
}

console.log(
  `Prepared ${rows.length} rows from ${geojson.features.length} constellations`,
);

const chunkSize = 100;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize);
  await prisma.constellationLine.createMany({ data: chunk });
  console.log(`Inserted ${i + chunk.length} / ${rows.length}`);
}
