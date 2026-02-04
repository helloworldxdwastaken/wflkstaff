import { NextResponse } from 'next/server';
import analyticsData from '@/data/analytics-jan-2026.json';

export async function GET() {
  try {
    // Return the historical analytics data
    // In a production environment, you might fetch this from a database
    // or aggregate it from AzuraCast's history endpoints
    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error('Failed to fetch historical data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
