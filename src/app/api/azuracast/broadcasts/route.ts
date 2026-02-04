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
    // First get all streamers
    const streamersResponse = await fetch(`${API_URL}/station/${STATION_ID}/streamers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      next: { revalidate: 60 }
    });

    if (!streamersResponse.ok) {
      throw new Error(`AzuraCast API Error: ${streamersResponse.statusText}`);
    }

    const streamers = await streamersResponse.json();

    // Fetch broadcast history for each streamer
    const allBroadcasts: any[] = [];

    await Promise.all(
      streamers.map(async (streamer: any) => {
        try {
          const broadcastsResponse = await fetch(
            `${API_URL}/station/${STATION_ID}/streamer/${streamer.id}/broadcasts`,
            {
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
              },
              next: { revalidate: 60 }
            }
          );

          if (broadcastsResponse.ok) {
            const broadcasts = await broadcastsResponse.json();
            // Log first broadcast to see field names
            if (broadcasts.length > 0) {
              console.log('Broadcast fields:', Object.keys(broadcasts[0]));
              console.log('Sample broadcast:', JSON.stringify(broadcasts[0], null, 2));
            }
            broadcasts.forEach((broadcast: any) => {
              allBroadcasts.push({
                id: broadcast.id,
                streamer_id: streamer.id,
                streamer_name: streamer.display_name || streamer.streamer_username,
                // Try different possible field names
                timestamp_start: broadcast.timestamp_start || broadcast.timestampStart || broadcast.start || null,
                timestamp_end: broadcast.timestamp_end || broadcast.timestampEnd || broadcast.end || null,
                recording: broadcast.recording || null,
              });
            });
          }
        } catch (e) {
          // Skip this streamer if there's an error
          console.error(`Failed to fetch broadcasts for streamer ${streamer.id}:`, e);
        }
      })
    );

    // Sort by start time (most recent first)
    allBroadcasts.sort((a, b) => b.timestamp_start - a.timestamp_start);

    // Return last 50 broadcasts
    return NextResponse.json(allBroadcasts.slice(0, 50));

  } catch (error: any) {
    console.error('Failed to fetch broadcasts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}
