const API_KEY = process.env.FINNHUB_API_KEY || '';

export const WATCHLIST_TICKERS = [
  { ticker: "SOFI", name: "SoFi Technologies", category: "FINTECH" },
  { ticker: "ATOS", name: "Atos SE", category: "TECH" },
  { ticker: "NVDA", name: "NVIDIA Corporation", category: "AI & CLOUD" },
  { ticker: "ASML", name: "ASML Holding", category: "TECH" },
  { ticker: "TSLA", name: "Tesla, Inc.", category: "TECH" },
  { ticker: "BEAM", name: "Beam Therapeutics", category: "BIOTECH" },
  { ticker: "SPCX", name: "SpaceX (Pre-IPO)", category: "SPACE/DEFENSE" },
  { ticker: "VYGR", name: "Voyager Technologies", category: "SPACE/DEFENSE" },
  { ticker: "RKLB", name: "Rocket Lab USA", category: "SPACE/DEFENSE" },
  { ticker: "EEE", name: "Empire Metals", category: "TECH" },
  { ticker: "CW", name: "CoreWeave", category: "AI & CLOUD" },
  { ticker: "NBIS", name: "Nebius Group", category: "AI & CLOUD" },
  { ticker: "MDAI", name: "Spectral AI", category: "BIOTECH" },
  { ticker: "AAPL", name: "Apple Inc.", category: "TECH" },
  { ticker: "RDDT", name: "Reddit Inc.", category: "TECH" },
  { ticker: "NWBO", name: "Northwest Biotherapeutics", category: "BIOTECH" },
  { ticker: "FTC", name: "Filtronic plc", category: "SPACE/DEFENSE" },
  { ticker: "INTC", name: "Intel Corporation", category: "TECH" },
  { ticker: "UBI", name: "Ubisoft Entertainment", category: "TECH" },
  { ticker: "RDW", name: "Redwire Corporation", category: "SPACE/DEFENSE" }
];

class ApiQueue {
  constructor(delayMs = 250) {
    this.queue = [];
    this.processing = false;
    this.delayMs = delayMs;
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      await new Promise(res => setTimeout(res, this.delayMs));
    }
    this.processing = false;
  }
}

const apiQueue = new ApiQueue(250);

export async function fetchStockQuote(symbol) {
  return apiQueue.add(async () => {
    try {
      const res = await fetch(`/api/quote?symbol=${symbol}`);
      
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error('Non-JSON response from quote API');
      }

      const data = await res.json();
      return {
        price: data.price || 0,
        change: data.change || 0
      };
    } catch {
      return { price: 0, change: 0 };
    }
  });
}

export async function fetchStockCandles(symbol, timeframe, currentPrice = 0) {
  try {
    const res = await fetch(`/api/charts?symbol=${symbol}&timeframe=${timeframe}`);
    
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (data.prices && data.prices.length > 0) {
        if (currentPrice > 0) {
          data.prices[data.prices.length - 1] = currentPrice;
        }
        return data;
      }
    }
  } catch (err) {
    // Fall back
  }

  return generateAnchoredFallbackCandles(symbol, timeframe, currentPrice);
}

function generateAnchoredFallbackCandles(ticker, timeframe, currentPrice) {
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  let count = 78; // High density for 1D (e.g. 5-min intervals)
  let stepMinutes = 5;

  if (timeframe === '1M') {
    count = 100;
    stepMinutes = 4320; // ~3 days per step across a month
  } else if (timeframe === '3M') {
    count = 150;
    stepMinutes = 1440 * 1.5;
  } else if (timeframe === '1Y') {
    count = 250; // Full 250 daily trading ticks for the year
    stepMinutes = 1440; // 1 day per step
  }

  const prices = [];
  const timestamps = [];
  const targetPrice = currentPrice > 0 ? currentPrice : ((seed % 100) + 25);
  const volatility = targetPrice * 0.025;
  const now = new Date();

  for (let i = 0; i < count; i++) {
    let pricePoint;
    if (i === count - 1) {
      pricePoint = targetPrice; // Final anchor is exact live price
    } else {
      const wave = Math.sin((seed + i) * 0.3) * volatility;
      const stepBackOffset = (count - 1 - i) * (targetPrice * 0.001);
      pricePoint = Math.max(1, targetPrice - stepBackOffset + wave);
    }
    
    prices.push(Number(pricePoint.toFixed(2)));
    const pastDate = new Date(now.getTime() - (count - 1 - i) * stepMinutes * 60 * 1000);

    if (timeframe === '1D') {
      timestamps.push(pastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else if (timeframe === '1M' || timeframe === '3M') {
      timestamps.push(pastDate.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    } else {
      timestamps.push(pastDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' }));
    }
  }

  return { prices, timestamps };
}