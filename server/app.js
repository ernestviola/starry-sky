import express from 'express';
import cors from 'cors';
import starRouter from './routes/starRouter.js';
import constellationRouter from './routes/constellationRouter.js';
import gameRouter from './routes/gameRouter.js';

import passport from 'passport';
import './libs/passport.js';

const PORT = process.env.PORT || 3000;
const allowedOrigins = [process.env.STARRY_SKY_FRONTEND];

const app = express();

// MIDDLEWARE

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS.'));
      }
    },
  }),
);

app.use(passport.initialize());

// ROUTES
app.use('/api/stars', starRouter);
app.use('/api/constellations', constellationRouter);
app.use('/api/game', gameRouter);

// Error Handling
app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.status || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;
  res.status(statusCode).json({ message });
});

// Serve
if (process.env.NODE_ENV !== 'test')
  app.listen(PORT, (err) => {
    if (err) throw new Error('Trouble starting the app.');
    console.log(`App listening on PORT: ${PORT}`);
  });

export default app;
