// data/fetchStock.js
export async function getStockCandles(symbol, resolution = 'D') {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  
  // Calculate timestamps (UNIX epoch) for historical data
  const to = Math.floor(Date.now() / 1000);
  const from = to - (30 * 24 * 60 * 60); // Past 30 days

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
    );
    const data = await res.json();
    
    if (data.s === "ok") {
      // Map API array to Chart.js format
      return {
        prices: data.c, // Closing prices
        timestamps: data.t.map(t => new Date(t * 1000).toLocaleDateString())
      };
    }
  } catch (err) {
    console.error("Failed to fetch stock data:", err);
  }
}