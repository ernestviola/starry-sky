import styles from './searchList.module.css';

const SearchList = ({ items = [], expanded = true }) => {
  const entries = Object.entries(items);
  const foundCount = entries.filter(([, item]) => item.found).length;

  return (
    <div>
      <div className={`${styles.header} ${expanded ? '' : styles.headingCollapsed}`}>
        <h2 id='search-list-heading' className={styles.heading}>
          Stars to find!
        </h2>
        <span className={styles.count}>
          {foundCount} / {entries.length}
        </span>
      </div>
      <ul
        id='search-list'
        aria-labelledby='search-list-heading'
        className={`${styles.searchList} ${expanded ? '' : styles.collapsed}`}
      >
        {entries.map(([key, item]) => (
          <li role='listitem' key={key} className={`${styles.row} ${item.found ? styles.found : ''}`}>
            <span className={styles.dot} aria-hidden='true' />
            <span className={styles.text}>
              <span className={`${styles.name} ${item.found ? styles.found : ''}`}>{item.name}</span>
              <span className={styles.catalogId}>{item.id || key}</span>
            </span>
            <span className={styles.tag}>{item.found ? 'FOUND' : 'TO FIND'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchList;
