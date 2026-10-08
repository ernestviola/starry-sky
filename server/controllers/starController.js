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
const SEARCH_PAGE_SIZE = 3;

const searchQueryValidation = [
  query('q').trim().isLength({ min: 1, max: 80 }).withMessage('q must be 1 to 80 characters.'),
  query('offset').optional().isInt({ min: 0, max: 200000 }).toInt(),
];

const starSelect = {
  id: true,
  hip: true,
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
};

const searchSelect = {
  ...starSelect,
  hd: true,
  hr: true,
  gl: true,
  bf: true,
  bayer: true,
};

starController.getAll = async (req, res, next) => {
  try {
    const stars = await prisma.hygStar.findMany({ select: starSelect });

    return res.status(200).json({
      count: stars.length,
      stars,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

starController.search = [
  searchQueryValidation,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'q must be 1 to 80 characters.' });
    }

    try {
      const { q, offset = 0 } = matchedData(req);
      const catalogMatch = q.match(/^(HIP|HD|HR|ID)\s*(\d+)$/i);
      const numericId = /^\d+$/.test(q) ? Number(q) : catalogMatch ? Number(catalogMatch[2]) : null;
      const catalogField = catalogMatch?.[1].toLowerCase();
      const idFields = catalogField ? [catalogField] : ['id', 'hip', 'hd', 'hr'];
      const stars = await prisma.hygStar.findMany({
        where: {
          OR: [
            { proper: { contains: q, mode: 'insensitive' } },
            { gl: { contains: q, mode: 'insensitive' } },
            { bf: { contains: q, mode: 'insensitive' } },
            { bayer: { contains: q, mode: 'insensitive' } },
            ...(numericId === null || numericId > 2147483647 ? [] : idFields.map((field) => ({ [field]: numericId }))),
          ],
        },
        select: searchSelect,
        orderBy: [{ proper: 'asc' }, { hip: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: SEARCH_PAGE_SIZE + 1,
      });

      return res.status(200).json({ success: true, stars: stars.slice(0, SEARCH_PAGE_SIZE), hasMore: stars.length > SEARCH_PAGE_SIZE });
    } catch (error) {
      next(error);
    }
  },
];

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
        select: starSelect,
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
