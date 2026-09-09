import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SearchList from './SearchList.jsx';

test('component should be in the document', () => {
  render(<SearchList />);

  const list = screen.getByRole('list');

  expect(list).toBeInTheDocument();
});

test('given a list, it should render each of the list items', () => {
  const items = [1, 2, 3];

  render(<SearchList items={items} />);

  const list = screen.getByRole('list');

  expect(list).toBeInTheDocument();
});
