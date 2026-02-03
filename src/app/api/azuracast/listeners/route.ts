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
    // 1. Fetch Current Listeners (Live)
    // Endpoint: /station/{station_id}/listeners
    const listenersResponse = await fetch(`${API_URL}/station/${STATION_ID}/listeners`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!listenersResponse.ok) {
      throw new Error(`AzuraCast API Error: ${listenersResponse.statusText}`);
    }

    const listenersData = await listenersResponse.json();

    // 2. Fetch Station Summary (for total unique/concurrent if available in a summary)
    // Often /nowplaying or /station/{id} has this. Let's stick to listeners for now.
    
    // Process Data for Frontend
    // The AzuraCast listeners endpoint returns an array of listener objects:
    // [{ ip: "...", user_agent: "...", connected_time: 123, location: {...} }, ...]
    
    // We need to transform this into the shape expected by the dashboard 
    // OR return raw data and let dashboard handle it.
    // Returning processed data is safer to match existing UI.

    return NextResponse.json({
        total_listeners: listenersData.length,
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
