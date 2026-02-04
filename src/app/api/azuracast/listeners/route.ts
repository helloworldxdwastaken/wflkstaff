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
    // Fetch both listeners list and nowplaying data in parallel
    const [listenersResponse, nowPlayingResponse] = await Promise.all([
      fetch(`${API_URL}/station/${STATION_ID}/listeners`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        next: { revalidate: 30 }
      }),
      fetch(`${API_URL}/nowplaying/${STATION_ID}`, {
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 15 }
      })
    ]);

    if (!listenersResponse.ok) {
      throw new Error(`AzuraCast API Error: ${listenersResponse.statusText}`);
    }

    const listenersData = await listenersResponse.json();
    
    // Get current and unique from nowplaying if available
    let currentListeners = listenersData.length;
    let uniqueListeners = listenersData.length;
    
    if (nowPlayingResponse.ok) {
      const nowPlayingData = await nowPlayingResponse.json();
      currentListeners = nowPlayingData.listeners?.current ?? listenersData.length;
      uniqueListeners = nowPlayingData.listeners?.unique ?? listenersData.length;
    }

    return NextResponse.json({
        total_listeners: currentListeners,
        current_listeners: currentListeners,
        unique_listeners: uniqueListeners,
        listeners: listenersData
    });

  } catch (error: any) {
    console.error('Failed to fetch AzuraCast data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch listener data' },
      { status: 500 }
    );
  }
}
