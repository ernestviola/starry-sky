import { NavLink } from 'react-router';
import styles from './navbar.module.css';

const Navbar = () => {
  return (
    <header className={styles.navbar}>
      <NavLink className={styles.logo} to='/'>
        STARRY SKY
      </NavLink>
      <nav>
        <ul>
          <li>
            <NavLink
              to='/'
              end
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
