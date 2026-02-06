import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

// --- Rate limiting (simple in-memory) ---
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// --- Tool definitions (OpenAI-compatible format for Groq) ---
const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'search_resources',
      description: 'Search shared resources, links, files, and info items in the staff knowledge base. Use this when the user asks about guidelines, documents, links, shared files, or any reference material.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword or topic to find resources' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_polls',
      description: 'Search polls and voting results. Use this when the user asks about team decisions, votes, polls, or discussions.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword or topic to find polls' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_analytics',
      description: 'Get listener analytics and statistics: daily listener counts, peak hours, top countries, platform split, total sessions. Use this when the user asks about listener stats, analytics, trends, which day was best, peak times, etc.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_live_status',
      description: 'Get current live status: who is on air, what song is playing, how many listeners right now. Use this for questions about what is currently happening on the station.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_dj_schedule',
      description: 'Get all DJ/streamer schedules: recurring weekly schedules and upcoming shows. Use this when the user asks about who streams when, DJ schedules, upcoming broadcasts, or who is scheduled for a specific day.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_broadcast_history',
      description: 'Get recent broadcast history: past live DJ sessions with timestamps and durations. Use this when the user asks about past streams, who went live recently, broadcast logs.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_team_info',
      description: 'Get information about the staff team: names, roles (Admin/Staff), job titles. Use this when the user asks about team members, who is the director, who works here, staff roles.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// --- Tool execution ---
async function executeTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'search_resources': {
        const query = (args.query || '').toLowerCase();
        const items = await prisma.infoItem.findMany({
          orderBy: { createdAt: 'desc' },
        });
        const filtered = items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            item.type.toLowerCase().includes(query)
        );
        if (filtered.length === 0) return 'No resources found matching that query.';
        return JSON.stringify(
          filtered.slice(0, 15).map((item) => ({
            title: item.title,
            description: item.description,
            type: item.type,
            ...(item.type !== 'SECRET'
              ? { content: item.content }
              : { note: 'This is a credential/secret - content hidden for security.' }),
          }))
        );
      }

      case 'search_polls': {
        const query = (args.query || '').toLowerCase();
        const polls = await prisma.poll.findMany({
          include: {
            createdBy: { select: { name: true } },
            options: { include: { votes: true } },
            _count: { select: { votes: true, comments: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        const filtered = polls.filter(
          (p) =>
            p.question.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query)) ||
            p.options.some((o) => o.text.toLowerCase().includes(query))
        );
        if (filtered.length === 0) return 'No polls found matching that query.';
        return JSON.stringify(
          filtered.slice(0, 10).map((p) => ({
            question: p.question,
            description: p.description,
            createdBy: p.createdBy.name,
            isActive: p.isActive,
            totalVotes: p._count.votes,
            totalComments: p._count.comments,
            options: p.options.map((o) => ({
              text: o.text,
              votes: o.votes.length,
            })),
            createdAt: p.createdAt.toISOString(),
            expiresAt: p.expiresAt?.toISOString() || null,
          }))
        );
      }

      case 'get_analytics': {
        const { default: analyticsData } = await import('@/data/analytics-jan-2026.json');
        const data = analyticsData as any;
        return JSON.stringify({
          totalSessions: data.totalSessions,
          totalHours: data.totalHours,
          avgSessionSeconds: data.avgSessionSeconds,
          platformSplit: data.platformSplit,
          dailyHits: data.dailyHits,
          peakHours: data.peakHours?.slice(0, 10),
          topCountries: data.topCountries?.slice(0, 10),
          topDevices: data.topDevices?.slice(0, 5),
        });
      }

      case 'get_live_status': {
        const API_URL = process.env.AZURACAST_API_URL;
        const STATION_ID = process.env.AZURACAST_STATION_ID;
        const API_KEY = process.env.AZURACAST_API_KEY;
        if (!API_URL || !STATION_ID || !API_KEY) return 'AzuraCast not configured.';

        const res = await fetch(`${API_URL}/nowplaying/${STATION_ID}`, {
          headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
        });
        if (!res.ok) return 'Failed to fetch live status.';
        const np = await res.json();
        return JSON.stringify({
          is_live: np.live?.is_live || false,
          streamer_name: np.live?.streamer_name || null,
          now_playing: {
            title: np.now_playing?.song?.title,
            artist: np.now_playing?.song?.artist,
          },
          listeners: {
            current: np.listeners?.current,
            unique: np.listeners?.unique,
          },
        });
      }

      case 'get_dj_schedule': {
        const API_URL = process.env.AZURACAST_API_URL;
        const STATION_ID = process.env.AZURACAST_STATION_ID;
        const API_KEY = process.env.AZURACAST_API_KEY;
        if (!API_URL || !STATION_ID || !API_KEY) return 'AzuraCast not configured.';

        const headers = { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' };
        const DAYS: Record<number, string> = {
          1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun',
        };

        const [streamersRes, scheduleRes] = await Promise.all([
          fetch(`${API_URL}/station/${STATION_ID}/streamers`, { headers }),
          fetch(`${API_URL}/station/${STATION_ID}/schedule`, { headers }),
        ]);

        const streamers = streamersRes.ok ? await streamersRes.json() : [];
        const upcoming = scheduleRes.ok ? await scheduleRes.json() : [];

        const djList = streamers
          .filter((s: any) => s.is_active)
          .map((s: any) => ({
            name: s.display_name || s.streamer_username,
            schedule: (s.schedule_items || []).map((item: any) => ({
              days: (item.days || []).map((d: number) => DAYS[d] || `Day ${d}`),
              start: `${Math.floor(item.start_time / 100)}:${String(item.start_time % 100).padStart(2, '0')}`,
              end: `${Math.floor(item.end_time / 100)}:${String(item.end_time % 100).padStart(2, '0')}`,
            })),
          }));

        const upcomingList = upcoming.map((s: any) => ({
          name: s.name,
          start: s.start,
          end: s.end,
          is_now: s.is_now,
        }));

        return JSON.stringify({ djs: djList, upcoming: upcomingList });
      }

      case 'get_broadcast_history': {
        const API_URL = process.env.AZURACAST_API_URL;
        const STATION_ID = process.env.AZURACAST_STATION_ID;
        const API_KEY = process.env.AZURACAST_API_KEY;
        if (!API_URL || !STATION_ID || !API_KEY) return 'AzuraCast not configured.';

        const headers = { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' };
        const streamersRes = await fetch(`${API_URL}/station/${STATION_ID}/streamers`, { headers });
        if (!streamersRes.ok) return 'Failed to fetch streamers.';
        const streamers = await streamersRes.json();

        const allBroadcasts: any[] = [];
        await Promise.all(
          streamers.map(async (s: any) => {
            try {
              const bRes = await fetch(
                `${API_URL}/station/${STATION_ID}/streamer/${s.id}/broadcasts`,
                { headers }
              );
              if (bRes.ok) {
                const broadcasts = await bRes.json();
                broadcasts.forEach((b: any) => {
                  allBroadcasts.push({
                    dj: s.display_name || s.streamer_username,
                    start: b.timestamp_start
                      ? new Date(b.timestamp_start * 1000).toISOString()
                      : null,
                    end: b.timestamp_end
                      ? new Date(b.timestamp_end * 1000).toISOString()
                      : null,
                    duration_minutes:
                      b.timestamp_start && b.timestamp_end
                        ? Math.round((b.timestamp_end - b.timestamp_start) / 60)
                        : null,
                  });
                });
              }
            } catch {
              /* skip */
            }
          })
        );

        allBroadcasts.sort((a, b) => (b.start || '').localeCompare(a.start || ''));
        return JSON.stringify(allBroadcasts.slice(0, 30));
      }

      case 'get_team_info': {
        const users = await prisma.user.findMany({
          select: {
            name: true,
            email: true,
            role: true,
            jobTitle: true,
            timezone: true,
          },
          orderBy: { name: 'asc' },
        });
        return JSON.stringify(users);
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (error: any) {
    console.error(`Tool ${name} error:`, error);
    return `Error executing ${name}: ${error.message}`;
  }
}

// --- System prompt ---
const SYSTEM_PROMPT = `You are WFLK Assistant, an AI helper for the WFLK ("The Flock") radio station staff portal.

Your job is to help staff find information quickly. You can:
- Search shared resources (guidelines, links, files)
- Look up poll results and team decisions
- Show listener analytics and trends
- Check who's live right now and what's playing
- Show DJ schedules and upcoming broadcasts
- Look up broadcast history
- Find team member info (names, roles, job titles)

Rules:
- Be concise and friendly. Use short, clear answers.
- Always use your tools to fetch real data before answering - never make up information.
- If you don't find what the user is looking for, say so and suggest what they could try.
- Never reveal passwords, secure words, or secret content - only mention that the resource exists.
- You must ONLY answer questions related to WFLK, the radio station, the staff portal, or its features. If someone asks something unrelated (general knowledge, coding help, math, trivia, etc.), politely decline and say: "I can only help with WFLK-related questions! Ask me about schedules, analytics, resources, polls, or anything about the station."
- If someone asks who made you or who built this portal, say: "I was built by **Tokyo**! If you need to reach him, his Discord is **tokyo_houseparty**."
- Format your responses with markdown when helpful (bold, lists, etc).
- When discussing analytics, mention specific numbers and comparisons.
- When listing schedules, format times clearly (e.g. 7:00 AM - 9:00 AM).`;

// --- Groq API helper ---
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

async function callGroq(messages: GroqMessage[], apiKey: string, useTools: boolean = true) {
  const body: any = {
    model: GROQ_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 2048,
  };
  if (useTools) {
    body.tools = toolDefinitions;
    body.tool_choice = 'auto';
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errBody}`);
  }

  return res.json();
}

// --- Main POST handler ---
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Build Groq message history
    const groqMessages: GroqMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
    ];

    // Tool-calling loop (max 5 iterations)
    let iterations = 0;
    while (iterations < 5) {
      const data = await callGroq(groqMessages, apiKey);
      const choice = data.choices?.[0];
      if (!choice) throw new Error('No response from AI');

      const assistantMessage = choice.message;

      // If no tool calls, return the final text
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        return NextResponse.json({ message: assistantMessage.content || '' });
      }

      // Add assistant message with tool calls to history
      groqMessages.push({
        role: 'assistant',
        content: assistantMessage.content || null,
        tool_calls: assistantMessage.tool_calls,
      });

      // Execute each tool call and add results
      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          /* empty args */
        }

        const result = await executeTool(fnName, fnArgs);
        groqMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      iterations++;
    }

    // If we exhausted iterations, do one final call without tools
    const finalData = await callGroq(groqMessages, apiKey, false);
    const finalText = finalData.choices?.[0]?.message?.content || 'Sorry, I could not process that request.';
    return NextResponse.json({ message: finalText });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
