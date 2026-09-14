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
            <NavLink to='/'>Home</NavLink>
          </li>
          <li>
            <NavLink to='/explore'>Explore</NavLink>
          </li>
          <li>
            <NavLink to='/play'>Play</NavLink>
          </li>
          <li>
            <NavLink to='/about'>About</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
