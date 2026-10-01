import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import styles from './navbar.module.css';

const Navbar = () => {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const firstLinkRef = useRef(null);
  const previousPathnameRef = useRef(pathname);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    if (isMenuOpen) closeMenu();
  }, [pathname, isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen && !wasMenuOpenRef.current) firstLinkRef.current?.focus();
    wasMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const preventCurrentNavigation = (path) => (event) => {
    if (pathname === path) event.preventDefault();
    if (isMenuOpen) closeMenu();
    else setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMenuOpen) closeMenu();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

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
      <button
        ref={menuButtonRef}
        className={styles.menuButton}
        type='button'
        aria-expanded={isMenuOpen}
        aria-controls='primary-navigation'
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => (isMenuOpen ? closeMenu() : setIsMenuOpen(true))}
      >
        <span aria-hidden='true'>☰</span>
      </button>
      <nav id='primary-navigation' aria-label='Primary navigation'>
        <ul className={isMenuOpen ? styles.open : undefined}>
          <li>
            <NavLink
              ref={firstLinkRef}
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
