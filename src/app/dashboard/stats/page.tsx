"use client"

import { SideNav } from "@/components/side-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Headphones, Globe, Clock, Smartphone, AlertCircle, Loader2 } from "lucide-react"
import { DailyHitsChart, PeakHoursChart, PlatformPieChart, WeeklyHitsChart } from "@/components/dashboard/stats-charts"
import { useEffect, useState } from "react"

// Types based on AzuraCast listener object (simplified)
interface AzuraListener {
    ip: string
    user_agent: string
    connect_time: number // unix timestamp
    location: {
        country: string
        region: string
        city: string
        lat: number
        lon: number
    }
    device: {
        is_mobile: boolean
        client: string // browser/player
    }
}

interface AnalyticsState {
    totalSessions: number
    totalHours: number // estimated from current listeners
    avgSessionSeconds: number
    topCountries: { code: string, count: number }[]
    topDevices: { name: string, count: number }[]
    platformSplit: { mobile: number, desktop: number }
    dailyHits: { date: string, hits: number }[] // derived or mocked
    weeklyHits: { name: string, count: number }[] // derived or mocked
    peakHours: { hour: string, count: number }[] // derived or mocked
}

export default function StatsPage() {
    const [stats, setStats] = useState<AnalyticsState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/azuracast/listeners')
                if (!response.ok) throw new Error('Failed to fetch live stats')

                const data = await response.json()
                const listeners: AzuraListener[] = data.listeners || []

                // Process Live Data
                const countryMap: Record<string, number> = {}
                const deviceMap: Record<string, number> = {}
                let mobile = 0
                let desktop = 0
                let totalDuration = 0

                const now = Math.floor(Date.now() / 1000)

                listeners.forEach(l => {
                    // Country
                    const country = l.location?.country || 'Unknown'
                    countryMap[country] = (countryMap[country] || 0) + 1

                    // Device
                    const client = l.device?.client || 'Unknown'
                    deviceMap[client] = (deviceMap[client] || 0) + 1

                    // Platform
                    if (l.device?.is_mobile) mobile++
                    else desktop++

                    // Duration (Current session duration)
                    const duration = now - l.connect_time
                    totalDuration += duration
                })

                // Top Countries
                const topCountries = Object.entries(countryMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([code, count]) => ({ code, count }))

                // Top Devices
                const topDevices = Object.entries(deviceMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }))

                // Mock/Placeholder for Historical Charts (since we only have live data)
                // In a real app, we'd persist this data or query a history endpoint
                const today = new Date().toISOString().split('T')[0]
                const dailyHits = [{ date: today, hits: listeners.length }]
                const weeklyHits = [{ name: 'Current Week', count: listeners.length }]
                const peakHours = Array.from({ length: 24 }, (_, i) => ({
                    hour: `${i}:00`,
                    count: 0 // Cannot know history yet
                }))

                // Update current hour
                const currentHour = new Date().getHours()
                peakHours[currentHour].count = listeners.length

                setStats({
                    totalSessions: listeners.length,
                    totalHours: Math.round(totalDuration / 3600),
                    avgSessionSeconds: listeners.length > 0 ? Math.round(totalDuration / listeners.length) : 0,
                    topCountries,
                    topDevices,
                    platformSplit: { mobile, desktop },
                    dailyHits,
                    weeklyHits,
                    peakHours
                })

            } catch (err: any) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
        // Poll every 30 seconds
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Connecting to AzuraCast...
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Error loading live stats: {error}</p>
                <p className="text-sm text-slate-500 mt-2">Check console and environment variables.</p>
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <SideNav />

            <main className="pl-64">
                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    <header className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                Live Analytics
                            </h1>
                            <p className="text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Real-time Listener Data (AzuraCast)
                            </p>
                        </div>
                    </header>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Current Listeners</CardTitle>
                                <Headphones className="h-4 w-4 text-indigo-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.totalSessions.toLocaleString()}</div>
                                <p className="text-xs text-slate-500">Live now</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Active Duration</CardTitle>
                                <Clock className="h-4 w-4 text-cyan-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.totalHours}h</div>
                                <p className="text-xs text-slate-500">Avg Session: {Math.floor(stats.avgSessionSeconds / 60)}m {stats.avgSessionSeconds % 60}s</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Top Country</CardTitle>
                                <Globe className="h-4 w-4 text-emerald-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.topCountries[0]?.code || 'N/A'}</div>
                                <p className="text-xs text-slate-500">{stats.topCountries[0]?.count.toLocaleString() || 0} listeners</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Top Device</CardTitle>
                                <Smartphone className="h-4 w-4 text-pink-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.topDevices[0]?.name.split(' ')[0] || 'N/A'}</div>
                                <p className="text-xs text-slate-500">{stats.topDevices[0]?.count.toLocaleString() || 0} sessions</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Charts Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Daily Trend (2/3 width) */}
                        <div className="lg:col-span-2 space-y-4">
                            <Tabs defaultValue="monthly" className="w-full">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-medium text-slate-200">Listener Trends</h2>
                                    <TabsList className="bg-slate-900 border border-slate-800">
                                        <TabsTrigger value="monthly">Daily</TabsTrigger>
                                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="monthly">
                                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium text-slate-400">Daily Activity (Live)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <DailyHitsChart data={stats.dailyHits} />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="weekly">
                                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium text-slate-400">Weekly Overview</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <WeeklyHitsChart data={stats.weeklyHits} />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-medium text-slate-200">Peak Listening Hours (Today)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PeakHoursChart data={stats.peakHours} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Stats (1/3 width) */}
                        <div className="space-y-4">
                            {/* Device Split */}
                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-medium text-slate-200">Platform Split</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <PlatformPieChart
                                            mobile={stats.platformSplit.mobile}
                                            desktop={stats.platformSplit.desktop}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <span className="text-xs font-bold text-pink-400 block">Mobile</span>
                                                <span className="text-xs font-bold text-sky-400 block">Desktop</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                        <div className="bg-slate-800/50 rounded p-2">
                                            <div className="text-2xl font-bold text-pink-400">
                                                {stats.totalSessions > 0 ? Math.round((stats.platformSplit.mobile / stats.totalSessions) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-slate-500">Mobile</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded p-2">
                                            <div className="text-2xl font-bold text-sky-400">
                                                {stats.totalSessions > 0 ? Math.round((stats.platformSplit.desktop / stats.totalSessions) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-slate-500">Desktop</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Top Countries List */}
                            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-medium text-slate-200">Top Countries</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.topCountries.length > 0 ? stats.topCountries.map((country, idx) => (
                                            <div key={country.code} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}.</span>
                                                    <span className="text-sm font-medium text-slate-300">{country.code}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 bg-slate-800 rounded-full w-24 overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500/70"
                                                            style={{ width: `${(country.count / stats.topCountries[0].count) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400 w-10 text-right">{country.count}</span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center text-slate-500 text-sm py-4">
                                                No listener location data
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
