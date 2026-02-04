import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AZURACAST_API_URL;
const STATION_ID = process.env.AZURACAST_STATION_ID;
const API_KEY = process.env.AZURACAST_API_KEY;

// GET single streamer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`${API_URL}/station/${STATION_ID}/streamer/${id}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AzuraCast API Error: ${response.statusText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update streamer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    const response = await fetch(`${API_URL}/station/${STATION_ID}/streamer/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AzuraCast API Error: ${response.statusText} - ${errorText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE streamer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!API_URL || !STATION_ID || !API_KEY) {
    return NextResponse.json({ error: 'AzuraCast environment variables are missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`${API_URL}/station/${STATION_ID}/streamer/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AzuraCast API Error: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
