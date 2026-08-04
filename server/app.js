import express from 'express';
import cors from 'cors';
import starRouter from './routes/starRouter.js';

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
// ROUTES
app.use('/api/stars', starRouter);

// Error Handling
app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.status || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;
  res.status(statusCode).json({ message });
});

// Serve
app.listen(PORT, (err) => {
  if (err) throw new Error('Trouble starting the app.');
  console.log(`App listening on PORT: ${PORT}`);
});
