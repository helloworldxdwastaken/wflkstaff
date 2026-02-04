import { NextResponse } from 'next/server';

export async function GET() {
  const API_URL = process.env.AZURACAST_API_URL;
  const STATION_ID = process.env.AZURACAST_STATION_ID;

  if (!API_URL || !STATION_ID) {
    return NextResponse.json(
      { error: 'AzuraCast environment variables are missing' },
      { status: 500 }
    );
  }

  try {
    // Fetch Now Playing data (public endpoint, no auth needed)
    const response = await fetch(`${API_URL}/nowplaying/${STATION_ID}`, {
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 10 } // Cache for 10 seconds
    });

    if (!response.ok) {
      throw new Error(`AzuraCast API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Return relevant data for the dashboard
    return NextResponse.json({
      station: {
        name: data.station?.name,
        listen_url: data.station?.listen_url,
      },
      live: {
        is_live: data.live?.is_live || false,
        streamer_name: data.live?.streamer_name || null,
      },
      now_playing: {
        song: {
          title: data.now_playing?.song?.title,
          artist: data.now_playing?.song?.artist,
          art: data.now_playing?.song?.art,
        },
        elapsed: data.now_playing?.elapsed,
        duration: data.now_playing?.duration,
        is_request: data.now_playing?.is_request,
      },
      listeners: {
        current: data.listeners?.current || 0,
        unique: data.listeners?.unique || 0,
      },
      song_history: data.song_history?.slice(0, 5) || [],
    });

  } catch (error: any) {
    console.error('Failed to fetch now playing data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch now playing data' },
      { status: 500 }
    );
  }
}
