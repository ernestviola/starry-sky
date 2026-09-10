import styles from './searchList.module.css';

const SearchList = ({ items = [] }) => {
  return (
    <div role='list'>
      <h2>Stars to find!</h2>
      <ul className={styles.searchList}>
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
