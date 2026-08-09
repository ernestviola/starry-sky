import { prisma } from '../libs/prisma.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

const raw = await fs.readFile(
  path.join(os.homedir(), '/Downloads/data/modernIAUConstellationLines.json'),
  'utf-8',
);

const geojson = JSON.parse(raw);

const rows = [];

for (const constellation of geojson.constellations) {
  const constellationName = constellation.common_name.english;
  const byname = constellation.common_name.byname;
  if (byname) console.log(byname);
  for (const [i, line] of constellation.lines.entries()) {
    const lineIndex = i;
    for (const [i, hip] of line.entries()) {
      rows.push({
        constellationName,
        byname,
        lineIndex,
        hip,
      });
    }
  }
}

console.log(
  `Prepared ${rows.length} rows from ${geojson.constellations.length} constellations`,
);

// --- Diagnostic: find HIPs that don't exist in hyg_stars before inserting ---
async function findMissingHips(hipNumbers) {
  const uniqueHips = [...new Set(hipNumbers)];

  const existing = await prisma.hygStar.findMany({
    where: { hip: { in: uniqueHips } },
    select: { hip: true },
  });

  const existingSet = new Set(existing.map((s) => s.hip));
  const missing = uniqueHips.filter((hip) => !existingSet.has(hip));

  console.log(`Checked ${uniqueHips.length} unique HIPs`);
  console.log(`Found ${existingSet.size} in hyg_stars`);
  console.log(`Missing ${missing.length}:`, missing);

  return missing;
}

const missingHips = await findMissingHips(rows.map((r) => r.hip));
const missingHipSet = new Set(missingHips);

if (missingHips.length > 0) {
  console.log('MANUAL FOLLOW-UP NEEDED — missing HIPs:', missingHips);
  // Ursa Major HIP 55203 — find and backfill manually later
}

// Drop rows whose hip isn't in hyg_stars, so createMany doesn't blow up on FK violations
const insertableRows = rows.filter((r) => !missingHipSet.has(r.hip));

console.log(
  `Skipping ${rows.length - insertableRows.length} rows with missing HIPs, inserting ${insertableRows.length}`,
);
// --- end diagnostic ---

const chunkSize = 100;
for (let i = 0; i < insertableRows.length; i += chunkSize) {
  const chunk = insertableRows.slice(i, i + chunkSize);
  await prisma.constellation.createMany({ data: chunk });
  console.log(`Inserted ${i + chunk.length} / ${insertableRows.length}`);
}
