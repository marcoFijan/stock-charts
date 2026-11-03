'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchStockCandles } from '../../../data/stockApi';
import styles from './StockChart.module.css';

// Register Chart.js controllers
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// Internal helper: builds a realistic curve that ends exactly at the stock's live price, tailored per timeframe
function generateAnchoredFallbackCandles(ticker, timeframe, currentPrice) {
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Distinct point counts and step sizes for each timeframe
  let count = 12;
  let timeStepHours = 1;

  if (timeframe === '1W') {
    count = 14;
    timeStepHours = 12; // 7 days total
  } else if (timeframe === '1M') {
    count = 30;
    timeStepHours = 24; // 30 days total (daily points)
  } else if (timeframe === '1Y') {
    count = 52;
    timeStepHours = 168; // 52 weeks total (weekly points)
  }

  const prices = [];
  const timestamps = [];
  
  const targetPrice = currentPrice > 0 ? currentPrice : ((seed % 100) + 25);
  const volatility = targetPrice * 0.025;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    let pricePoint;
    if (i === count - 1) {
      pricePoint = targetPrice; // Exact live price anchor at the end
    } else {
      const wave = Math.sin((seed + i) * 0.4) * volatility;
      const stepBackOffset = (count - 1 - i) * (targetPrice * 0.002);
      pricePoint = Math.max(1, targetPrice - stepBackOffset + wave);
    }
    
    prices.push(Number(pricePoint.toFixed(2)));

    const pastDate = new Date(now - (count - 1 - i) * timeStepHours * 3600 * 1000);
    
    if (timeframe === '1D') {
      timestamps.push(pastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else if (timeframe === '1W' || timeframe === '1M') {
      timestamps.push(pastDate.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    } else {
      timestamps.push(pastDate.toLocaleDateString([], { month: 'short', year: '2-digit' }));
    }
  }

  return { prices, timestamps };
}

export default function StockChart({ ticker, isPositive, timeframe = '1D', currentPrice = 0 }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const apiData = await fetchStockCandles(ticker, timeframe, currentPrice);

      if (isMounted) {
        if (apiData && apiData.prices && apiData.prices.length > 0) {
          setChartData(apiData);
        } else {
          setChartData(generateFallbackCandles(ticker, timeframe, isPositive, currentPrice));
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ticker, timeframe, isPositive, currentPrice]);

  if (loading || !chartData) {
    return <div className={styles.chartPlaceholder}>Loading Chart...</div>;
  }

  // Determine positivity based on the actual start vs end price of this specific timeframe
  const prices = chartData.prices;
  const timeframeIsPositive = prices.length > 1 
    ? prices[prices.length - 1] >= prices[0] 
    : isPositive;

  const strokeColor = timeframeIsPositive ? '#00ff88' : '#ff3b5c';

  const data = {
    labels: chartData.timestamps,
    datasets: [
      {
        id: ticker,
        label: `${ticker} Price`,
        data: prices,
        borderColor: strokeColor,
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: strokeColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, timeframeIsPositive ? 'rgba(0, 255, 136, 0.35)' : 'rgba(255, 59, 92, 0.35)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#090a0d',
        titleColor: '#8a99ad',
        bodyColor: '#ffffff',
        bodyFont: { weight: 'bold', size: 14 },
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => `Time: ${items[0].label}`,
          label: (context) => `Price: $${Number(context.parsed.y).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8a99ad', font: { size: 10 }, maxTicksLimit: 6 },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#8a99ad',
          font: { size: 10 },
          callback: (val) => `$${val}`,
        },
      },
    },
  };

  return (
    <div className={styles.chartCanvasContainer}>
      <Line datasetIdKey={ticker} data={data} options={options} />
    </div>
  );
}