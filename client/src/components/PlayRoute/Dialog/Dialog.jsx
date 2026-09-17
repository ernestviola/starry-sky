import styles from './dialog.module.css';

const Dialog = ({ ref, className = '', children, ...props }) => {
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${className}`.trim()}
      onCancel={(event) => event.preventDefault()}
      {...props}
    >
      {children}
    </dialog>
  );
};

export default Dialog;
