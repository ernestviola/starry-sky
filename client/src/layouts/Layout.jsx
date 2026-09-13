import { Outlet } from 'react-router';
import Navbar from '../components/Navbar/Navbar.jsx';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
