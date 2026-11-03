import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1D';

    if (!symbol) {
      return NextResponse.json({ prices: [], timestamps: [] });
    }

    let range = '1d';
    let interval = '15m';

    if (timeframe === '1W') {
      range = '5d';
      interval = '1h';
    } else if (timeframe === '1M') {
      range = '1mo';
      interval = '1d';
    } else if (timeframe === '1Y') {
      range = '1y';
      interval = '1wk';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      return NextResponse.json({ prices: [], timestamps: [] });
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.indicators?.quote?.[0]?.close) {
      return NextResponse.json({ prices: [], timestamps: [] });
    }

    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    const cleanedData = timestamps.map((t, index) => ({
      time: t,
      price: prices[index]
    })).filter(item => item.price !== null && item.price !== undefined);

    if (cleanedData.length === 0) {
      return NextResponse.json({ prices: [], timestamps: [] });
    }

    const formattedTimestamps = cleanedData.map(item => {
      const date = new Date(item.time * 1000);
      if (timeframe === '1D') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeframe === '1W' || timeframe === '1M') {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
      }
    });

    const formattedPrices = cleanedData.map(item => Number(item.price.toFixed(2)));

    return NextResponse.json({
      prices: formattedPrices,
      timestamps: formattedTimestamps
    });

  } catch (error) {
    return NextResponse.json({ prices: [], timestamps: [] });
  }
}