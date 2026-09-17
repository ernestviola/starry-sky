import { NavLink, useLocation } from 'react-router';
import styles from './navbar.module.css';

const Navbar = () => {
  const { pathname } = useLocation();
  const preventCurrentNavigation = (path) => (event) => {
    if (pathname === path) event.preventDefault();
  };

  return (
    <header className={styles.navbar}>
      <NavLink
        className={styles.logo}
        to='/'
        viewTransition
        onClick={preventCurrentNavigation('/')}
      >
        STARRY SKY
      </NavLink>
      <nav>
        <ul>
          <li>
            <NavLink
              to='/'
              end
              viewTransition
              onClick={preventCurrentNavigation('/')}
              className={({ isActive }) =>
                isActive ? styles.active : undefined
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to='/explore'
              viewTransition
              onClick={preventCurrentNavigation('/explore')}
              className={({ isActive }) =>
                isActive ? styles.active : undefined
              }
            >
              Explore
            </NavLink>
          </li>
          <li>
            <NavLink
              to='/play'
              viewTransition
              onClick={preventCurrentNavigation('/play')}
              className={({ isActive }) =>
                isActive ? styles.active : undefined
              }
            >
              Play
            </NavLink>
          </li>
          <li>
            <NavLink
              to='/about'
              viewTransition
              onClick={preventCurrentNavigation('/about')}
              className={({ isActive }) =>
                isActive ? styles.active : undefined
              }
            >
              About
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
