import { prisma } from '../libs/prisma.js';
import { validationResult, matchedData, query } from 'express-validator';

const frameQueryValidation = [
  query('frames')
    .exists()
    .bail()
    .customSanitizer((value) => value.split(',').map(Number))
    .custom((arr) => arr.length > 0 && arr.every((n) => Number.isInteger(n)))
    .withMessage('frames must be a comma-separated list of integers'),
];

const starController = {};

// returns a single star based on x,y,z coordinates
starController.get = () => {};

// returns a list of stars based on a frame from lat,long
starController.getFrame = [
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
      const { frames } = matchedData(req);

      const starFrame = await prisma.hygStar.findMany({
        where: { healpixId: { in: frames } },
        select: {
          id: true,
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

      const frameIds = [...new Set(starFrame.map((star) => star.healpixId))];

      return res.status(200).json({
        count: starFrame.length,
        frameIds,
        stars: starFrame,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },
];

export default starController;
