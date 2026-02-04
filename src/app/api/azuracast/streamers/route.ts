import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AZURACAST_API_URL;
const STATION_ID = process.env.AZURACAST_STATION_ID;
const API_KEY = process.env.AZURACAST_API_KEY;

export async function GET() {
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json(
      { error: 'AzuraCast environment variables are missing' },
      { status: 500 }
    );
  }

  try {
    // Fetch all streamers/DJs
    const streamersResponse = await fetch(`${API_URL}/station/${STATION_ID}/streamers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!streamersResponse.ok) {
      throw new Error(`AzuraCast API Error: ${streamersResponse.statusText}`);
    }

    const streamers = await streamersResponse.json();

    // Fetch schedules for each streamer
    const streamersWithSchedules = await Promise.all(
      streamers.map(async (streamer: any) => {
        try {
          const scheduleResponse = await fetch(
            `${API_URL}/station/${STATION_ID}/streamer/${streamer.id}/schedule`,
            {
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
              },
              next: { revalidate: 60 }
            }
          );

          const schedule = scheduleResponse.ok ? await scheduleResponse.json() : [];

          return {
            id: streamer.id,
            streamer_username: streamer.streamer_username,
            display_name: streamer.display_name,
            is_active: streamer.is_active,
            enforce_schedule: streamer.enforce_schedule,
            schedule: schedule,
          };
        } catch {
          return {
            id: streamer.id,
            streamer_username: streamer.streamer_username,
            display_name: streamer.display_name,
            is_active: streamer.is_active,
            enforce_schedule: streamer.enforce_schedule,
            schedule: [],
          };
        }
      })
    );

    return NextResponse.json(streamersWithSchedules);

  } catch (error: any) {
    console.error('Failed to fetch streamers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch streamers' },
      { status: 500 }
    );
  }
}

// POST create new streamer
export async function POST(request: NextRequest) {
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { streamer_username, streamer_password, display_name, is_active } = body;

    if (!streamer_username || !streamer_password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/station/${STATION_ID}/streamers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        streamer_username,
        streamer_password,
        display_name: display_name || streamer_username,
        is_active: is_active ?? true,
        enforce_schedule: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AzuraCast API Error: ${response.statusText} - ${errorText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    console.error('Failed to create streamer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
