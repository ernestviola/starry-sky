import { prisma } from '../libs/prisma.js';
import { validationResult, matchedData, query } from 'express-validator';
import { ang2pix_ring } from '@hscmap/healpix';

const frameQueryValidation = [query('ra').isFloat(), query('dec').isFloat()];

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
      const { ra, dec } = matchedData(req);
      const theta = Math.PI / 2 - dec;
      const phi = ra;

      const healpixId = ang2pix_ring(8, theta, phi);

      const starFrame = await prisma.hygStar.findMany({
        where: { healpixId },
        select: {
          id: true,
          healpixId: true,
          rarad: true,
          decrad: true,
          x: true,
          y: true,
          z: true,
          proper: true,
          con: true,
        },
      });

      return res
        .status(200)
        .json({ count: starFrame.length, frame: starFrame, success: true });
    } catch (error) {
      next(error);
    }
  },
];

export default starController;
