import { prisma } from '../libs/prisma.js';
import { query, validationResult, matchedData } from 'express-validator';

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
      const [catalog, alternateNames] = await Promise.all([
        prisma.constellationCatalog.findMany({
          orderBy: { iauName: 'asc' },
        }),
        prisma.constellation.findMany({
          where: { byname: { contains: q, mode: 'insensitive' } },
          select: { constellationName: true, byname: true },
          distinct: ['constellationName'],
        }),
      ]);
      const alternateNamesBySource = new Map(
        alternateNames.map(({ constellationName, byname }) => [
          constellationName,
          byname,
        ]),
      );
      const normalizedQuery = q.toLocaleLowerCase();
      const matches = catalog.filter((constellation) =>
        [
          constellation.iauName,
          constellation.abbreviation,
          constellation.sourceName,
        ].some((name) => name.toLocaleLowerCase().includes(normalizedQuery)) ||
        alternateNamesBySource.has(constellation.sourceName),
      );
      const constellations = matches.slice(offset, offset + SEARCH_PAGE_SIZE + 1);

      return res.status(200).json({
        success: true,
        constellations: constellations.slice(0, SEARCH_PAGE_SIZE).map((constellation) => ({
          constellationName: constellation.sourceName,
          byname: alternateNamesBySource.get(constellation.sourceName) ?? null,
          name: constellation.iauName,
          abbreviation: constellation.abbreviation,
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
