import { NextResponse } from 'next/server';

// Helper to parse timestamp - handles Unix timestamps (seconds or milliseconds) and ISO strings
function parseTimestamp(value: any): number | null {
  if (!value) return null;
  
  // If it's already a number
  if (typeof value === 'number') {
    // If it looks like milliseconds (13+ digits), convert to seconds
    if (value > 10000000000) {
      return Math.floor(value / 1000);
    }
    return value;
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Try parsing as ISO date string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000);
    }
    // Try parsing as numeric string
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      if (num > 10000000000) {
        return Math.floor(num / 1000);
      }
      return num;
    }
  }
  
  return null;
}

// Helper to extract timestamp from various possible field names
function extractTimestamp(broadcast: any, ...fieldNames: string[]): number | null {
  for (const fieldName of fieldNames) {
    const value = broadcast[fieldName];
    if (value !== undefined && value !== null && value !== 0) {
      const parsed = parseTimestamp(value);
      if (parsed !== null && parsed > 0) {
        return parsed;
      }
    }
  }
  return null;
}

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
    let hasLoggedSample = false;

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
            
            // Log first broadcast to see field names (only once)
            if (broadcasts.length > 0 && !hasLoggedSample) {
              hasLoggedSample = true;
              console.log('=== BROADCAST API DEBUG ===');
              console.log('Broadcast fields:', Object.keys(broadcasts[0]));
              console.log('Sample broadcast raw data:', JSON.stringify(broadcasts[0], null, 2));
              console.log('=== END DEBUG ===');
            }
            
            broadcasts.forEach((broadcast: any) => {
              // Try all possible field name variations for timestamps
              const timestampStart = extractTimestamp(
                broadcast,
                'timestamp_start',
                'timestampStart', 
                'start',
                'started_at',
                'startedAt',
                'start_time',
                'startTime',
                'time_start'
              );
              
              const timestampEnd = extractTimestamp(
                broadcast,
                'timestamp_end',
                'timestampEnd',
                'end',
                'ended_at',
                'endedAt',
                'end_time',
                'endTime',
                'time_end'
              );
              
              allBroadcasts.push({
                id: broadcast.id,
                streamer_id: streamer.id,
                streamer_name: streamer.display_name || streamer.streamer_username || streamer.username || 'Unknown DJ',
                timestamp_start: timestampStart,
                timestamp_end: timestampEnd,
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

    // Sort by start time (most recent first), handling null timestamps
    allBroadcasts.sort((a, b) => {
      const aStart = a.timestamp_start || 0;
      const bStart = b.timestamp_start || 0;
      return bStart - aStart;
    });

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
