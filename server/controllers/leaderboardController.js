import { query, matchedData, validationResult } from 'express-validator';
import { prisma } from '../libs/prisma.js';

const leaderboardController = {};

const globalValidation = [
  query('page')
    .optional()
    .default(1)
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer.'),
  query('leaderboardId')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('LeaderboardId must be a positive integer.'),
];

leaderboardController.getGlobal = [
  globalValidation,
  async (req, res, next) => {
    const pageSize = 3;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const queryErrors = {};
      errors.array().forEach((error) => {
        queryErrors[error.path] = error.msg;
      });
      return res.status(400).json({ queryErrors, success: false });
    }
    try {
      const { page = 1, leaderboardId } = matchedData(req);

      let leaderboard;
      if (leaderboardId >= 1) {
        console.log('Has leaderboardId');
        leaderboard = await prisma.$queryRaw`
        with ranked as (

        select 
          rank() over (order by l."totalTimeMiliseconds" ) as "rank",
          row_number() over (order by l."totalTimeMiliseconds", l."id" ) as position,
          l.id,                                             
          l.name,                                           
          l."totalTimeMiliseconds",                         
          l."geoLat",                                       
          l."geoLong"
        from "Leaderboard" l
        ),
        paged as (
          select ranked.*, ((position -1)/${pageSize} + 1) as "pageNumber" from ranked
        )
        select * from paged
        where "pageNumber" = (
          select "pageNumber" from paged where id = ${leaderboardId}	
        )
        order by position
        `;
      } else {
        let skip;
        skip = (page - 1) * pageSize;

        leaderboard = await prisma.$queryRaw`
        select 
          rank() over (order by l."totalTimeMiliseconds") as rank, 
          row_number() over (order by l."totalTimeMiliseconds", l."id" ) as position,
          l.id,
          l."name",
          l."geoLat",
        l."geoLong",
        l."totalTimeMiliseconds"
        from "Leaderboard" l
        order by l."totalTimeMiliseconds" asc
        LIMIT ${pageSize}
        OFFSET ${skip}
      `;
      }

      const serialized = leaderboard.map((entry) => ({
        ...entry,
        rank: Number(entry.rank),
        position: Number(entry.position),
        pageNumber: Number(entry.pageNumber),
        id: Number(entry.id),
      }));

      const count = await prisma.leaderboard.count();
      const lastPosition = serialized.at(-1)?.position ?? 0;

      console.log(serialized);
      console.log(page);

      res.status(201).json({
        success: true,
        leaderboard: serialized,
        page,
        hasNext: lastPosition < count,
      });
    } catch (error) {
      next(error);
    }
  },
];

leaderboardController.getLocal = (req, res, next) => {
  const latitude = req.query.latitude;
  const longitude = req.query.latitude;
  const page = req.query.page;
};

export default leaderboardController;
