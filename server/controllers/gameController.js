import jwt from 'jsonwebtoken';
import { prisma } from '../libs/prisma.js';

const gameController = {};

const submitValidator = [];

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

gameController.submitName = (req, res, next) => {
  try {
    const totalTime = req.user.totalTime;
  } catch (error) {}
};

export default gameController;
