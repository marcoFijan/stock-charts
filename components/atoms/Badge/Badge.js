import styles from './Badge.module.css';
export default function Badge({ children, type = 'default' }) { return <span className={`${styles.badge} ${styles[type]}`}>{children}</span>; }