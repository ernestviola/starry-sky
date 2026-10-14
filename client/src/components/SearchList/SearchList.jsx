import styles from './searchList.module.css';

const SearchList = ({ items = [] }) => (
  <ul id='search-list' aria-label='Stars to find!' className={styles.searchList}>
    {Object.entries(items).sort(([, a], [, b]) => Number(a.found) - Number(b.found)).map(([key, item]) => (
      <li key={key} className={`${styles.row} ${item.found ? styles.found : ''}`}>
        <span>{item.name}</span>
        <span className={styles.srOnly}>{item.found ? ' — found' : ' — to find'}</span>
      </li>
    ))}
  </ul>
);

export default SearchList;
