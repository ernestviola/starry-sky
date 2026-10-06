import { prisma } from '../libs/prisma.js';
import { query, validationResult, matchedData } from 'express-validator';
import constellationAliases from '../data/constellationAliases.json' with { type: 'json' };

const constellationController = {};
const SEARCH_PAGE_SIZE = 3;

const searchQueryValidation = [
  query('q').trim().isLength({ min: 1, max: 80 }).withMessage('q must be 1 to 80 characters.'),
  query('offset').optional().isInt({ min: 0, max: 200000 }).toInt(),
];

constellationController.search = [
  searchQueryValidation,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'q must be 1 to 80 characters.' });
    }

    try {
      const { q, offset = 0 } = matchedData(req);
      // The stored line names are English descriptions; users also search by IAU name or abbreviation.
      const aliasMatches = Object.entries(constellationAliases)
        .filter(([, alias]) =>
          alias.name.toLowerCase().includes(q.toLowerCase()) ||
          alias.abbreviation.toLowerCase().includes(q.toLowerCase()))
        .map(([englishName]) => englishName);
      const constellations = await prisma.constellation.findMany({
        where: {
          OR: [
            { constellationName: { contains: q, mode: 'insensitive' } },
            { byname: { contains: q, mode: 'insensitive' } },
            { constellationName: { in: aliasMatches } },
          ],
        },
        select: { constellationName: true, byname: true },
        distinct: ['constellationName'],
        orderBy: { constellationName: 'asc' },
        skip: offset,
        take: SEARCH_PAGE_SIZE + 1,
      });

      return res.status(200).json({
        success: true,
        constellations: constellations.slice(0, SEARCH_PAGE_SIZE).map((constellation) => ({
          ...constellation,
          ...constellationAliases[constellation.constellationName],
        })),
        hasMore: constellations.length > SEARCH_PAGE_SIZE,
      });
    } catch (error) {
      next(error);
    }
  },
];

constellationController.getByName = async (req, res, next) => {
  try {
    const constellationLines = await prisma.constellation.findMany({
      where: { constellationName: req.params.name },
      select: {
        id: true,
        constellationName: true,
        lineIndex: true,
        pointIndex: true,
        star: { select: { decrad: true, rarad: true } },
      },
      orderBy: [{ lineIndex: 'asc' }, { pointIndex: 'asc' }],
    });

    if (constellationLines.length === 0) {
      return res.status(404).json({ success: false, message: 'Constellation not found.' });
    }

    return res.status(200).json({
      success: true,
      constellationName: req.params.name,
      constellationLines,
    });
  } catch (error) {
    next(error);
  }
};

const frameQueryValidation = [
  query('frames')
    .exists()
    .bail()
    .customSanitizer((value) => value.split(',').map(Number))
    .custom((arr) => arr.length > 0 && arr.every((n) => Number.isInteger(n)))
    .withMessage('frames must be a comma-separated list of integers.'),
  query('receivedConstellationNames')
    .customSanitizer((value) => (value ? value.split(',') : []))
    .custom((arr) =>
      arr.every((con) => typeof con === 'string' && con.length > 0),
    )
    .withMessage(
      'receivedConstellationNames must be a comma-separated list of strings.',
    ),
];

constellationController.getFrame = [
  frameQueryValidation,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const queryErrors = {};
      errors.array().forEach((error) => {
        queryErrors[error.path] = error.msg;
      });
      return res.status(400).json({ queryErrors, success: false });
    }

    try {
      const { frames, receivedConstellationNames } = matchedData(req);
      const visibleConstellations = await prisma.constellation.findMany({
        where: { healpixId: { in: frames } },
        select: { constellationName: true },
        distinct: ['constellationName'],
      });

      const constellationArray = visibleConstellations.map(
        (data) => data.constellationName,
      );

      const receivedConstellationSet = new Set([...receivedConstellationNames]);

      const filteredConstellations = constellationArray.filter(
        (con) => !receivedConstellationSet.has(con),
      );

      const fullConstellations = await prisma.constellation.findMany({
        where: {
          constellationName: { in: filteredConstellations },
        },
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
        orderBy: [
          { constellationName: 'asc' },
          { lineIndex: 'asc' },
          { pointIndex: 'asc' },
        ],
      });

      return res.status(200).json({
        success: true,
        constellations: constellationArray,
        constellationLines: fullConstellations,
      });
    } catch (error) {
      next(error);
    }
  },
];

export default constellationController;
