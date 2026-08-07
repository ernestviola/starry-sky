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
    .optional()
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
      const visibleConstellations = await prisma.constellationLine.findMany({
        where: { healpixId: { in: frames } },
        select: { constellation: true },
        distinct: ['constellation'],
      });

      const constellationArray = visibleConstellations.map(
        (data) => data.constellation,
      );

      const receivedConstellationSet = new Set([...receivedConstellations]);

      const filteredConstellations = constellationArray.filter(
        (con) => !receivedConstellationSet.has(con),
      );

      const fullConstellations = await prisma.constellationLine.findMany({
        where: {
          constellation: { in: filteredConstellations },
        },
        select: {
          id: true,
          constellation: true,
          segmentIndex: true,
          pointIndex: true,
          rarad: true,
          decrad: true,
          starId: true,
          healpixId: true,
        },
        orderBy: {
          constellation: 'asc',
          segmentIndex: 'asc',
          pointIndex: 'asc',
        },
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
