'use client';
import { useState, useEffect } from 'react';
import { WATCHLIST_TICKERS } from '../data/stockApi';
import TickerTape from '../components/organisms/TickerTape/TickerTape';
import SearchBar from '../components/molecules/SearchBar/SearchBar';
import StockAccordionCard from '../components/organisms/StockAccordionCard/StockAccordionCard';
import styles from './page.module.css';

const INITIAL_FALLBACK = WATCHLIST_TICKERS.map(item => ({
  ...item,
  price: 100.00,
  change: 1.25
}));

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [stocksWithData, setStocksWithData] = useState(INITIAL_FALLBACK);
  const [loading, setLoading] = useState(false);

  const categories = ['ALL', 'TECH', 'SPACE/DEFENSE', 'BIOTECH', 'AI & CLOUD', 'FINTECH'];

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/stocks');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setStocksWithData(data);
        }
      } catch (err) {
        console.warn('Using fallback stock data due to fetch error:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const safeStocks = Array.isArray(stocksWithData) ? stocksWithData : INITIAL_FALLBACK;

  const filtered = safeStocks.filter((s) => {
    const matchesSearch =
      (s.ticker && s.ticker.toLowerCase().includes(search.toLowerCase())) ||
      (s.name && s.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'ALL' || s.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className={styles.main}>
      <TickerTape stocks={safeStocks} />

      <header className={styles.header}>
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.catBtn} ${category === cat ? styles.catActive : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <section className={styles.stockColumn}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8a99ad', padding: '40px' }}>
            No stocks found matching your search.
          </p>
        ) : (
          filtered.map((stock) => (
            <StockAccordionCard key={stock.ticker} stock={stock} />
          ))
        )}
      </section>
    </main>
  );
}