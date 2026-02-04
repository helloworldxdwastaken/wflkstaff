"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Headphones, Globe, Clock, Smartphone, AlertCircle, Loader2, TrendingUp, Users } from "lucide-react"
import { DailyHitsChart, PeakHoursChart, PlatformPieChart, WeeklyHitsChart } from "@/components/dashboard/stats-charts"
import { useEffect, useState } from "react"

interface HistoricalData {
    totalSessions: number
    totalHours: number
    avgSessionSeconds: number
    platformSplit: { mobile: number, desktop: number }
    dailyHits: { date: string, hits: number }[]
    weeklyHits: { name: string, count: number }[]
    peakHours: { hour: string, count: number }[]
    topCountries: { code: string, count: number }[]
    topDevices: { name: string, count: number }[]
}

// Get the last 7 days from daily data, formatted with day names
function getWeeklyData(dailyHits: { date: string, hits: number }[]) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Get the last 7 days of data
    const last7Days = dailyHits.slice(-7)
    
    return last7Days.map(day => {
        const date = new Date(day.date)
        return {
            name: dayNames[date.getDay()],
            fullDate: day.date,
            count: day.hits
        }
    })
}

interface LiveData {
    total_listeners: number
    listeners: any[]
}

export function StatsContent() {
    const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null)
    const [liveListeners, setLiveListeners] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch both historical and live data in parallel
                const [historyRes, liveRes] = await Promise.all([
                    fetch('/api/azuracast/history'),
                    fetch('/api/azuracast/listeners')
                ])

                if (!historyRes.ok) {
                    throw new Error('Failed to fetch historical data')
                }

                const history: HistoricalData = await historyRes.json()
                setHistoricalData(history)

                // Live data is optional - don't fail if AzuraCast is down
                if (liveRes.ok) {
                    const live: LiveData = await liveRes.json()
                    setLiveListeners(live.total_listeners || 0)
                }

            } catch (err: any) {
                console.error(err)
                setError(err.message)
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
                    const live: LiveData = await liveRes.json()
                    setLiveListeners(live.total_listeners || 0)
                }
            } catch (e) {
                // Silent fail for live updates
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading analytics...
            </div>
        )
    }

    if (error || !historicalData) {
        return (
            <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex flex-col items-center justify-center text-red-400 p-4 text-center">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Error loading analytics: {error}</p>
                <p className="text-sm text-slate-500 mt-2">Check console for details.</p>
            </div>
        )
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Station Analytics
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2 text-sm sm:text-base">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {liveListeners > 0 ? `${liveListeners} listening now` : 'Historical Data (January 2026)'}
                    </p>
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Live Now</CardTitle>
                        <Headphones className="h-4 w-4 text-emerald-400 hidden sm:block" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white">{liveListeners.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">Current listeners</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Total Sessions</CardTitle>
                        <Users className="h-4 w-4 text-indigo-400 hidden sm:block" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white">{historicalData.totalSessions.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">This month</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Total Hours</CardTitle>
                        <Clock className="h-4 w-4 text-cyan-400 hidden sm:block" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white">{historicalData.totalHours.toLocaleString()}h</div>
                        <p className="text-xs text-slate-500">Avg: {formatDuration(historicalData.avgSessionSeconds)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Top Country</CardTitle>
                        <Globe className="h-4 w-4 text-emerald-400 hidden sm:block" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="text-xl sm:text-2xl font-bold text-white">{historicalData.topCountries[0]?.code || 'N/A'}</div>
                        <p className="text-xs text-slate-500">{historicalData.topCountries[0]?.count.toLocaleString() || 0} sessions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Trends (2/3 width on desktop) */}
                <div className="lg:col-span-2 space-y-4">
                    <Tabs defaultValue="daily" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h2 className="text-base sm:text-lg font-medium text-slate-200">Listener Trends</h2>
                            <TabsList className="bg-slate-900/50 border border-slate-800 self-start">
                                <TabsTrigger value="daily" className="text-xs sm:text-sm text-slate-400 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">Daily</TabsTrigger>
                                <TabsTrigger value="weekly" className="text-xs sm:text-sm text-slate-400 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">Weekly</TabsTrigger>
                                <TabsTrigger value="hourly" className="text-xs sm:text-sm text-slate-400 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">Hourly</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="daily">
                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">
                                        Daily Sessions - January 2026
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                    <DailyHitsChart data={historicalData.dailyHits} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="weekly">
                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">
                                        This Week (Last 7 Days)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                    <WeeklyHitsChart data={getWeeklyData(historicalData.dailyHits)} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="hourly">
                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <span>Peak Listening Hours (24h)</span>
                                        <span className="text-xs text-slate-500 font-normal">
                                            Server time (UTC)
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                    <PeakHoursChart data={historicalData.peakHours} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Stats (1/3 width on desktop) */}
                <div className="space-y-4">
                    {/* Device Split */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg font-medium text-slate-200">Platform Split</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="relative">
                                <PlatformPieChart
                                    mobile={historicalData.platformSplit.mobile}
                                    desktop={historicalData.platformSplit.desktop}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="text-xs font-bold text-pink-400 block">Mobile</span>
                                        <span className="text-xs font-bold text-sky-400 block">Desktop</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 text-center">
                                <div className="bg-slate-800/50 rounded p-2">
                                    <div className="text-xl sm:text-2xl font-bold text-pink-400">
                                        {Math.round((historicalData.platformSplit.mobile / historicalData.totalSessions) * 100)}%
                                    </div>
                                    <div className="text-xs text-slate-500">Mobile</div>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2">
                                    <div className="text-xl sm:text-2xl font-bold text-sky-400">
                                        {Math.round((historicalData.platformSplit.desktop / historicalData.totalSessions) * 100)}%
                                    </div>
                                    <div className="text-xs text-slate-500">Desktop</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Countries List */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg font-medium text-slate-200">Top Countries</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="space-y-3">
                                {historicalData.topCountries.slice(0, 5).map((country, idx) => (
                                    <div key={country.code} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}.</span>
                                            <span className="text-sm font-medium text-slate-300">{country.code}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 bg-slate-800 rounded-full w-16 sm:w-24 overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500/70"
                                                    style={{ width: `${(country.count / historicalData.topCountries[0].count) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 w-12 sm:w-14 text-right">{country.count.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Devices */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg font-medium text-slate-200">Top Devices</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            <div className="space-y-3">
                                {historicalData.topDevices.slice(0, 5).map((device, idx) => (
                                    <div key={device.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}.</span>
                                            <span className="text-sm font-medium text-slate-300">{device.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 bg-slate-800 rounded-full w-16 sm:w-24 overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500/70"
                                                    style={{ width: `${(device.count / historicalData.topDevices[0].count) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 w-12 sm:w-14 text-right">{device.count.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
