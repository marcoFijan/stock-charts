import Input from '../../atoms/Input/Input';
import styles from './SearchBar.module.css';
export default function SearchBar({ value, onChange }) { return <div className={styles.searchContainer}><Input value={value} onChange={onChange} placeholder="Search stock symbol or name (e.g. NVDA, Nevius)..." /></div>; }