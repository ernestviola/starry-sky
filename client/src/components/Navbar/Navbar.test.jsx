import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import Navbar from './Navbar.jsx';

const RouteChangeButton = () => {
  const navigate = useNavigate();

  return (
    <button type='button' onClick={() => navigate('/about')}>
      Navigate to About
    </button>
  );
};

describe('Navigation tests', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <Navbar />
        <RouteChangeButton />
      </MemoryRouter>,
    );
  });
  test('component mounts', () => {
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('mobile menu opens and closes with Escape', () => {
    const menuButton = screen.getByRole('button', {
      name: /open navigation menu/i,
    });

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /home/i })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
  });

  test('menu link selection restores focus to the menu button', () => {
    const menuButton = screen.getByRole('button', {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole('link', { name: /home/i }));

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
  });

  test('route changes restore focus when the menu is open', () => {
    const menuButton = screen.getByRole('button', {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole('button', { name: /navigate to about/i }));

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
    expect(screen.getByRole('link', { name: /home/i })).not.toHaveFocus();
  });

  test('navigate links exist', () => {
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/',
    );

    expect(screen.getByRole('link', { name: /explore/i })).toHaveAttribute(
      'href',
      '/explore',
    );

    expect(screen.getByRole('link', { name: /play/i })).toHaveAttribute(
      'href',
      '/play',
    );

    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute(
      'href',
      '/about',
    );
  });
});
