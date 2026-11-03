'use client';

import { useState, useEffect } from 'react';
import { fetchStockQuote } from '../../../data/stockApi';
import Badge from '../../atoms/Badge/Badge';
import TimeframeSelector from '../../molecules/TimeframeSelector/TimeframeSelector';
import StockChart from '../../atoms/StockChart/StockChart';
import styles from './StockAccordionCard.module.css';

export default function StockAccordionCard({ stock }) {
  const [timeframe, setTimeframe] = useState('1D');
  const [livePrice, setLivePrice] = useState(stock.price);
  const [liveChange, setLiveChange] = useState(stock.change);

  useEffect(() => {
    async function getLatest() {
      const quote = await fetchStockQuote(stock.ticker);
      if (quote && quote.price > 0) {
        setLivePrice(quote.price);
        setLiveChange(quote.change);
      }
    }
    getLatest();
  }, [stock.ticker]);

  const isPositive = liveChange >= 0;

  return (
    <details className={styles.accordionContainer}>
      <summary className={styles.accordionSummary}>
        <div className={styles.leftInfo}>
          <div className={styles.avatar}>{stock.ticker.substring(0, 2)}</div>
          <div>
            <h3 className={styles.ticker}>{stock.ticker}</h3>
            <span className={styles.name}>{stock.name}</span>
          </div>
        </div>
        <div className={styles.rightInfo}>
          <span className={styles.price}>${livePrice.toFixed(2)}</span>
          <Badge type={isPositive ? 'positive' : 'negative'}>
            {isPositive ? '+' : ''}{liveChange.toFixed(2)}%
          </Badge>
        </div>
      </summary>

      <div className={styles.accordionBody}>
        <div className={styles.controlsRow}>
          <TimeframeSelector
            timeframes={['1D', '1W', '1M', '1Y']}
            selected={timeframe}
            isPositive={isPositive}
            onSelect={setTimeframe}
          />
          <span className={styles.categoryBadge}>{stock.category}</span>
        </div>

        <div className={styles.chartWrapper}>
          <StockChart
            ticker={stock.ticker}
            isPositive={isPositive}
            timeframe={timeframe}
            currentPrice={livePrice}
          />
        </div>
      </div>
    </details>
  );
}