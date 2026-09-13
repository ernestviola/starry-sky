import { NavLink } from 'react-router';
import styles from './navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div>Right Nav and Logo</div>
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
      <div>Left Nav Sign in Sign out</div>
    </nav>
  );
};

export default Navbar;
