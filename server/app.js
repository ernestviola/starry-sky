import express from 'express';
import starRouter from './routes/starRouter.js';

const PORT = process.env.PORT || 3000;

const app = express();

// MIDDLEWARE

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use('/api/stars', starRouter);

// Error Handling

// Serve
app.listen(PORT, (err) => {
  if (err) throw new Error('Trouble starting the app.');
  console.log(`App listening on PORT: ${PORT}`);
});
