import styles from './searchList.module.css';

const SearchList = ({ items = [] }) => {
  return (
    <div role='list' className={styles.searchList}>
      {Object.entries(items)
        .sort((a, b) => a - b)
        .map(([key, item]) => {
          return (
            <span
              role='listitem'
              key={item.id}
              className={item.found ? styles.found : ''}
            >
              {item.proper}
            </span>
          );
        })}
    </div>
  );
};

export default SearchList;
