export async function getStockCandles(symbol, resolution = 'D') {
  const apiKey = process.env.FINNHUB_API_KEY;
  const to = Math.floor(Date.now() / 1000);
  const from = to - (30 * 24 * 60 * 60);

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
    );
    const data = await res.json();
    
    if (data.s === "ok") {
      return {
        prices: data.c,
        timestamps: data.t.map(t => new Date(t * 1000).toLocaleDateString())
      };
    }
  } catch (err) {
    console.error("Failed to fetch stock data:", err);
  }
}