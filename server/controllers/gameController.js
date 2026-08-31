import jwt from 'jsonwebtoken';
import { prisma } from '../libs/prisma.js';

import { body, validationResult, matchedData } from 'express-validator';

const gameController = {};

const submitValidator = [
  body('name').isString(),
  body('latitude').isNumeric().optional(),
  body('longitude').isNumeric().optional(),
];

gameController.start = async (req, res, next) => {
  try {
    const starIds =
      await prisma.$queryRaw`select id,proper from hyg_stars hs where proper in ('Polaris', 'Sirius')`;

    const token = jwt.sign(
      {
        starsToFind: starIds,
        startTime: Date.now(),
      },
      process.env.PASSPORT_JS_SECRET,
    );
    res.status(201).send({ success: true, token });
  } catch (error) {
    next(error);
  }
};

gameController.submit = (req, res, next) => {
  // submit both star ids and
  try {
    const token = jwt.sign(
      {
        totalTime: Date.now() - req.user.startTime,
      },
      process.env.PASSPORT_JS_SECRET,
    );
    res.status(201).json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }

  if (req.user.startTime) {
  }
};

gameController.submitName = [
  submitValidator,
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
      const { name, latitude, longitude } = matchedData(req);
      const totalTime = req.user.totalTime;

      console.log(totalTime);
      console.log(req.body);

      const leaderboard = await prisma.leaderboard.create({
        data: {
          name,
          totalTimeMiliseconds: totalTime,
          geoLat: latitude,
          geoLong: longitude,
        },
      });

      console.log(leaderboard);

      res.status(201).json({
        success: true,
        leaderboardId: 2,
      });
    } catch (error) {
      console.log(error);
    }
  },
];

export default gameController;
