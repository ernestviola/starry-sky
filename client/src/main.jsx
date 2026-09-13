import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import Home from './routes/Home.jsx';
import Explore from './routes/Explore.jsx';
import Play from './routes/Play.jsx';
import About from './routes/About.jsx';
import Layout from './layouts/Layout.jsx';

import { StarDataProvider } from './contexts/StarDataContext.jsx';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/explore', element: <Explore /> },
      { path: '/play', element: <Play /> },
      { path: '/about', element: <About /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StarDataProvider>
      <RouterProvider router={router} />
    </StarDataProvider>
  </StrictMode>,
);
