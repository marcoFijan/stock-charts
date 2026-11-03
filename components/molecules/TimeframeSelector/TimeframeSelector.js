import Button from '../../atoms/Button/Button';
import styles from './TimeframeSelector.module.css';
export default function TimeframeSelector({ timeframes, selected, isPositive, onSelect }) { return <div className={styles.timeframeGroup}>{timeframes.map((tf) => (<Button key={tf} active={selected === tf} isPositive={isPositive} onClick={() => onSelect(tf)}>{tf}</Button>))}</div>; }