import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import Explore from './routes/Explore.jsx';
import Play from './routes/Play.jsx';
import About from './routes/About.jsx';
import { StarDataProvider } from './contexts/StarDataContext.jsx';

const router = createBrowserRouter([
  { path: '/', element: <Explore /> },
  { path: '/play', element: <Play /> },
  { path: '/about', element: <About /> },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StarDataProvider>
      <RouterProvider router={router} />
    </StarDataProvider>
  </StrictMode>,
);
