import { prisma } from '../libs/prisma.js';

const leaderboardController = {};

const localValidation = [];

leaderboardController.getGlobal = async (req, res, next) => {
  const page = req.query.page;
  const leaderboard = await prisma.$queryRaw`
  select 
    rank() over (order by l."totalTimeMiliseconds") as rank, 
    l.id,
    l."name",
    l."geoLat",
  l."geoLong"
  from "Leaderboard" l
  order by l."totalTimeMiliseconds" asc
  `;
};

leaderboardController.getLocal = (req, res, next) => {
  const latitude = req.query.latitude;
  const longitude = req.query.latitude;
  const page = req.query.page;
};

export default leaderboardController;
