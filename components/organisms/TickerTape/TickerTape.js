'use client';

import { useState, useEffect } from 'react';
import { fetchStockQuote } from '../../../data/stockApi';
import styles from './TickerTape.module.css';

export default function TickerTape({ stocks }) {
  const [liveStocks, setLiveStocks] = useState(stocks);

  useEffect(() => {
    async function updateAll() {
      const updated = await Promise.all(
        stocks.map(async (s) => {
          const q = await fetchStockQuote(s.ticker);
          return q && q.price > 0 ? { ...s, price: q.price, change: q.change } : s;
        })
      );
      setLiveStocks(updated);
    }
    updateAll();
  }, [stocks]);

  return (
    <div className={styles.tapeWrapper}>
      <div className={styles.tapeTrack}>
        {liveStocks.concat(liveStocks).map((stock, i) => (
          <div key={`${stock.ticker}-${i}`} className={styles.tapeItem}>
            <span className={styles.symbol}>{stock.ticker}</span>
            <span className={styles.price}>${stock.price.toFixed(2)}</span>
            <span className={stock.change >= 0 ? styles.pos : styles.neg}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}