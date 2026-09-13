import { render, screen } from '@testing-library/react';
import vi, { beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router';
import Navbar from './Navbar.jsx';

describe('Navigation tests', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
  });
  test('component mounts', () => {
    expect(screen.getByRole('navigation')).toBeInTheDocument();
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
