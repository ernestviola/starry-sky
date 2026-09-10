import { render, screen } from '@testing-library/react';
import SearchList from './SearchList.jsx';
import styles from './searchList.module.css';

test('component should be in the document', () => {
  render(<SearchList />);

  const list = screen.getByRole('list');

  expect(list).toBeInTheDocument();
});

test('given a list, it should render each of the list items', () => {
  const stars = [
    { id: 1, proper: 'Sirius' },
    { id: 2, proper: 'Polaris' },
  ];

  render(<SearchList items={stars} />);

  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('Sirius')).toBeInTheDocument();
  expect(screen.getByText('Polaris')).toBeInTheDocument();
});

test('given a star was found we should mark it as found', () => {
  const stars = [{ id: 1, proper: 'Sirius' }];
  const found = { 1: true };

  render(<SearchList items={stars} itemsFound={found} />);

  const star = screen.getByText('Sirius');

  expect(star).toBeInTheDocument();
  expect(star).toHaveClass(styles.found);
});

test('updates when a star is found', () => {
  const stars = [{ id: 1, proper: 'Sirius' }];

  const { rerender } = render(
    <SearchList items={stars} itemsFound={{ 1: false }} />,
  );

  const star = screen.getByText('Sirius');

  expect(star).not.toHaveClass(styles.found);

  rerender(<SearchList items={stars} itemsFound={{ 1: true }} />);

  expect(star).toHaveClass(styles.found);
});
