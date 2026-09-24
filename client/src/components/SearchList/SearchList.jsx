import styles from './searchList.module.css';

const SearchList = ({ items = [] }) => {
  return (
    <div>
      <h2 id='search-list-heading'>Stars to find!</h2>
      <ul aria-labelledby='search-list-heading' className={styles.searchList}>
        {Object.entries(items)
          .sort((a, b) => a - b)
          .map((keyValue) => {
            const item = keyValue[1];
            return (
              <li
                role='listitem'
                key={keyValue[0]}
                className={item.found ? styles.found : ''}
              >
                {item.name}
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default SearchList;
