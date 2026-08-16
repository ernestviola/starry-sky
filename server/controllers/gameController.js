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

gameController.submit = (req, res) => {
  // submit both star ids and
};
export default gameController;
