import { NextResponse } from 'next/server';

const API_KEY = process.env.FINNHUB_API_KEY || '';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol || !API_KEY) {
      return NextResponse.json({ price: 0, change: 0 });
    }

    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`, {
      next: { revalidate: 30 } 
    });

    if (!res.ok) {
      return NextResponse.json({ price: 0, change: 0 });
    }

    const data = await res.json();
    return NextResponse.json({
      price: data.c || 0,
      change: data.dp || 0
    });
  } catch (error) {
    return NextResponse.json({ price: 0, change: 0 });
  }
}