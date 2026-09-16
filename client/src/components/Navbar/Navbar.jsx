import { NavLink } from 'react-router';
import styles from './navbar.module.css';

const Navbar = () => {
  return (
    <header className={styles.navbar}>
      <NavLink className={styles.logo} to='/' viewTransition>
        STARRY SKY
      </NavLink>
      <nav>
        <ul>
          <li>
            <NavLink
              to='/'
              end
              viewTransition
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
