import { NextResponse } from 'next/server';

export async function GET() {
  const API_URL = process.env.AZURACAST_API_URL;
  const STATION_ID = process.env.AZURACAST_STATION_ID;
  const API_KEY = process.env.AZURACAST_API_KEY;

  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json(
      { error: 'AzuraCast environment variables are missing' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${API_URL}/station/${STATION_ID}/schedule`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`AzuraCast API Error: ${res.statusText}`);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch station schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch station schedule' },
      { status: 500 }
    );
  }
}
