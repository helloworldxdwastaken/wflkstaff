'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Headphones, Users, Clock, TrendingUp, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip,
    XAxis
} from 'recharts'

interface HistoricalData {
    totalSessions: number
    totalHours: number
    avgSessionSeconds: number
    dailyHits: { date: string, hits: number }[]
}

export function AnalyticsWidget() {
    const [data, setData] = useState<HistoricalData | null>(null)
    const [liveListeners, setLiveListeners] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [historyRes, liveRes] = await Promise.all([
                    fetch('/api/azuracast/history'),
                    fetch('/api/azuracast/listeners')
                ])

                if (historyRes.ok) {
                    const history = await historyRes.json()
                    setData(history)
                }

                if (liveRes.ok) {
                    const live = await liveRes.json()
                    setLiveListeners(live.total_listeners || 0)
                }
            } catch (err) {
                console.error('Failed to fetch analytics:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Poll live listeners every 30 seconds
        const interval = setInterval(async () => {
            try {
                const liveRes = await fetch('/api/azuracast/listeners')
                if (liveRes.ok) {
                    const live = await liveRes.json()
                    setLiveListeners(live.total_listeners || 0)
                }
            } catch (e) {
                // Silent fail
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 flex items-center justify-center h-[180px]">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return null
    }

    // Get last 7 days for the mini chart
    const last7Days = data.dailyHits.slice(-7)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { weekday: 'short' })
    }

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" /> Station Analytics
                </h2>
                <Link 
                    href="/dashboard/stats" 
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                    View full <ExternalLink className="h-3 w-3" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Live Listeners */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Headphones className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{liveListeners}</p>
                            <p className="text-[10px] text-slate-500 uppercase">Live Now</p>
                        </div>
                        {liveListeners > 0 && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                    </CardContent>
                </Card>

                {/* Total Sessions */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Users className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{data.totalSessions.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 uppercase">Sessions</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Hours */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Clock className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{data.totalHours.toLocaleString()}h</p>
                            <p className="text-[10px] text-slate-500 uppercase">Listen Time</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Mini Trend Chart */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-2 h-full">
                        <div className="h-[52px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last7Days}>
                                    <defs>
                                        <linearGradient id="colorMini" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="hits"
                                        stroke="#818cf8"
                                        strokeWidth={1.5}
                                        fill="url(#colorMini)"
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b', 
                                            border: 'none', 
                                            borderRadius: '6px', 
                                            fontSize: '11px',
                                            padding: '4px 8px'
                                        }}
                                        formatter={(value: number) => [value.toLocaleString(), 'Sessions']}
                                        labelFormatter={(label) => formatDate(label)}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center mt-1">Last 7 days</p>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
