import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AZURACAST_API_URL;
const STATION_ID = process.env.AZURACAST_STATION_ID;
const API_KEY = process.env.AZURACAST_API_KEY;

// GET all schedules for a streamer
export async function GET(request: NextRequest) {
  const streamerId = request.nextUrl.searchParams.get('streamerId');
  
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  if (!streamerId) {
    return NextResponse.json({ error: 'streamerId is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_URL}/station/${STATION_ID}/streamer/${streamerId}/schedule`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`AzuraCast API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new schedule item
export async function POST(request: NextRequest) {
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { streamerId, start_time, end_time, days } = body;

    if (!streamerId || start_time === undefined || end_time === undefined || !days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await fetch(
      `${API_URL}/station/${STATION_ID}/streamer/${streamerId}/schedule`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_time,
          end_time,
          days
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AzuraCast API Error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a schedule item
export async function DELETE(request: NextRequest) {
  const streamerId = request.nextUrl.searchParams.get('streamerId');
  const scheduleId = request.nextUrl.searchParams.get('scheduleId');

  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  if (!streamerId || !scheduleId) {
    return NextResponse.json({ error: 'streamerId and scheduleId are required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_URL}/station/${STATION_ID}/streamer/${streamerId}/schedule/${scheduleId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`AzuraCast API Error: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
