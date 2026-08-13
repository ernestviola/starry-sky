import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import Home from './routes/Home.jsx';
import Play from './routes/Play.jsx';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/', element: <Play /> },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
