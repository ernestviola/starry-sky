import { prisma } from '../libs/prisma.js';
import { query, validationResult, matchedData } from 'express-validator';

const constellationController = {};

const frameQueryValidation = [
  query('frames')
    .exists()
    .bail()
    .customSanitizer((value) => value.split(',').map(Number))
    .custom((arr) => arr.length > 0 && arr.every((n) => Number.isInteger(n)))
    .withMessage('frames must be a comma-separated list of integers.'),
  query('receivedConstellations')
    .customSanitizer((value) => (value ? value.split(',') : []))
    .custom((arr) =>
      arr.every((con) => typeof con === 'string' && con.length > 0),
    )
    .withMessage(
      'receivedConstellations must be a comma-separated list of strings.',
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
      const { frames, receivedConstellations } = matchedData(req);
      const visibleConstellations = await prisma.constellation.findMany({
        where: { healpixId: { in: frames } },
        select: { constellationName: true },
        distinct: ['constellationName'],
      });

      const constellationArray = visibleConstellations.map(
        (data) => data.constellationName,
      );

      const receivedConstellationSet = new Set([...receivedConstellations]);

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

      console.log(Date.now(), 'Returned Count:', fullConstellations.length);

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
