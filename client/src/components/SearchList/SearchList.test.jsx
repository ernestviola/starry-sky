import { render, screen } from '@testing-library/react';
import SearchList from './SearchList.jsx';
import styles from './searchList.module.css';

test('component should be in the document', () => {
  render(<SearchList />);

  const list = screen.getByRole('list', { name: 'Stars to find!' });

  expect(list).toBeInTheDocument();
});

test('given a list, it should render each of the list items', () => {
  const stars = {
    1: {
      found: false,
      name: 'Sirius',
    },
    2: {
      found: false,
      name: 'Polaris',
    },
  };

  render(<SearchList items={stars} />);

  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('Sirius')).toBeInTheDocument();
  expect(screen.getByText('Polaris')).toBeInTheDocument();
});

test('given a star was found we should mark it as found', () => {
  const stars = {
    1: {
      found: true,
      name: 'Sirius',
    },
    2: {
      found: false,
      name: 'Polaris',
    },
  };

  render(<SearchList items={stars} />);

  const star = screen.getByText('Sirius');

  expect(star).toBeInTheDocument();
  expect(star.closest('li')).toHaveClass(styles.found);
});

test('updates when a star is found', () => {
  const stars = {
    1: {
      found: false,
      name: 'Sirius',
    },
  };

  const { rerender } = render(<SearchList items={stars} />);

  const star = screen.getByText('Sirius');

  expect(star.closest('li')).not.toHaveClass(styles.found);

  rerender(
    <SearchList
      items={{
        1: {
          found: true,
          name: 'Sirius',
        },
      }}
    />,
  );

  expect(star.closest('li')).toHaveClass(styles.found);
});


test('moves found targets below unfound targets while preserving group order', () => {
  render(<SearchList items={{
    a: { name: 'Polaris', found: true },
    b: { name: 'Sirius', found: false },
    c: { name: 'Vega', found: true },
    d: { name: 'Deneb', found: false },
  }} />);
  expect(screen.getAllByRole('listitem').map(row => row.firstChild.textContent))
    .toEqual(['Sirius', 'Deneb', 'Polaris', 'Vega']);
});
