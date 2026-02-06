'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Radio, Calendar, History, Loader2, Music, Users, Clock, Mic, AlertCircle, Plus, Trash2, Pencil, UserPlus, CalendarDays, RefreshCw } from 'lucide-react'

interface NowPlayingData {
    station: { name: string; listen_url: string }
    live: { is_live: boolean; streamer_name: string | null }
    now_playing: {
        song: { title: string; artist: string; art: string }
        elapsed: number
        duration: number
        is_request: boolean
    }
    listeners: { current: number; unique: number }
    song_history: any[]
}

interface Streamer {
    id: number
    streamer_username: string
    display_name: string
    is_active: boolean
    enforce_schedule: boolean
    schedule: ScheduleItem[]
}

interface ScheduleItem {
    id: number
    start_time: number
    end_time: number
    start_date: string | null
    end_date: string | null
    days: number[]
}

interface Broadcast {
    id: number
    streamer_id: number
    streamer_name: string
    timestamp_start: number | null
    timestamp_end: number | null
    recording: any
}

interface UpcomingShow {
    id: number
    type: string
    name: string
    title: string
    description: string
    start: string
    end: string
    start_timestamp: number
    end_timestamp: number
    is_now: boolean
}

// AzuraCast uses ISO weekdays: 1=Mon, 2=Tue, ..., 7=Sun
const DAYS_ISO: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }
// JS weekday order for calendar view (0=Sun through 6=Sat)
const DAYS_JS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Map ISO day to JS day index: 1(Mon)->1, ..., 6(Sat)->6, 7(Sun)->0
const isoToJsDay = (iso: number) => iso === 7 ? 0 : iso

function formatTime(timeInt: number): string {
    const hours = Math.floor(timeInt / 100)
    const minutes = timeInt % 100
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

function formatDuration(startTimestamp: number | null, endTimestamp: number | null): string {
    if (!startTimestamp || startTimestamp <= 0 || isNaN(startTimestamp)) return 'Unknown'
    if (!endTimestamp || endTimestamp <= 0) return 'Ongoing'
    const durationSeconds = endTimestamp - startTimestamp
    if (isNaN(durationSeconds) || durationSeconds < 0) return 'Unknown'
    if (durationSeconds === 0) return '0m'
    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.floor((durationSeconds % 3600) / 60)
    if (isNaN(hours) || isNaN(minutes)) return 'Unknown'
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

function formatDate(timestamp: number | null): string {
    if (!timestamp || timestamp <= 0 || isNaN(timestamp)) return 'Unknown date'
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) return 'Unknown date'
    if (date.getFullYear() < 2000 || date.getFullYear() > 2100) return 'Unknown date'
    return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function formatTimeRange(startTimestamp: number | null, endTimestamp: number | null): string {
    if (!startTimestamp || startTimestamp <= 0 || isNaN(startTimestamp)) return 'Unknown'
    const startDate = new Date(startTimestamp * 1000)
    if (isNaN(startDate.getTime()) || startDate.getFullYear() < 2000) return 'Unknown'
    const startTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    if (!endTimestamp || endTimestamp <= 0) return `${startTime} - Ongoing`
    const endDate = new Date(endTimestamp * 1000)
    if (isNaN(endDate.getTime())) return `${startTime} - Ongoing`
    const endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return `${startTime} - ${endTime}`
}

function getRelativeDate(timestamp: number | null): string {
    if (!timestamp || timestamp <= 0 || isNaN(timestamp)) return ''
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return ''
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const broadcastDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (broadcastDate.getTime() === today.getTime()) return 'Today'
    if (broadcastDate.getTime() === yesterday.getTime()) return 'Yesterday'
    const diffDays = Math.floor((today.getTime() - broadcastDate.getTime()) / 86400000)
    if (diffDays > 0 && diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeUntil(isoString: string): string {
    const diff = new Date(isoString).getTime() - Date.now()
    if (diff <= 0) return 'now'
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `in ${mins}m`
    const hrs = Math.floor(mins / 60)
    const rm = mins % 60
    if (hrs < 24) return rm > 0 ? `in ${hrs}h ${rm}m` : `in ${hrs}h`
    const days = Math.floor(hrs / 24)
    const rh = hrs % 24
    return rh > 0 ? `in ${days}d ${rh}h` : `in ${days}d`
}

function formatShowTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatShowDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function BroadcastingContent() {
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null)
    const [streamers, setStreamers] = useState<Streamer[]>([])
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
    const [upcoming, setUpcoming] = useState<UpcomingShow[]>([])
    const [loading, setLoading] = useState({ live: true, schedule: true, history: true })
    const [errors, setErrors] = useState({ live: '', schedule: '', history: '' })

    // Schedule management state
    const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false)
    const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null)
    const [scheduleForm, setScheduleForm] = useState({ startTime: '09:00', endTime: '11:00', days: [] as number[] })
    const [submitting, setSubmitting] = useState(false)

    // DJ management state
    const [isAddDJOpen, setIsAddDJOpen] = useState(false)
    const [isEditDJOpen, setIsEditDJOpen] = useState(false)
    const [djForm, setDJForm] = useState({ username: '', password: '', displayName: '', isActive: true })
    const [editingDJ, setEditingDJ] = useState<Streamer | null>(null)

    // View state
    const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list')
    const [refreshing, setRefreshing] = useState({ schedule: false, history: false })

    const toggleDay = (day: number) => {
        setScheduleForm(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day].sort()
        }))
    }

    const timeToAzuraCast = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 100 + minutes
    }

    const handleAddSchedule = async () => {
        if (!selectedStreamer || scheduleForm.days.length === 0) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/azuracast/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    streamerId: selectedStreamer.id,
                    start_time: timeToAzuraCast(scheduleForm.startTime),
                    end_time: timeToAzuraCast(scheduleForm.endTime),
                    days: scheduleForm.days
                })
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create schedule')
            }
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) setStreamers(await streamersRes.json())
            setIsAddScheduleOpen(false)
            setScheduleForm({ startTime: '09:00', endTime: '11:00', days: [] })
            setSelectedStreamer(null)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteSchedule = async (streamerId: number, scheduleId: number) => {
        if (!confirm('Delete this schedule slot?')) return
        try {
            const res = await fetch(`/api/azuracast/schedule?streamerId=${streamerId}&scheduleId=${scheduleId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete schedule')
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) setStreamers(await streamersRes.json())
        } catch (err: any) {
            alert(err.message)
        }
    }

    const openAddSchedule = (streamer: Streamer) => {
        setSelectedStreamer(streamer)
        setScheduleForm({ startTime: '09:00', endTime: '11:00', days: [] })
        setIsAddScheduleOpen(true)
    }

    const handleAddDJ = async () => {
        if (!djForm.username || !djForm.password) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/azuracast/streamers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    streamer_username: djForm.username,
                    streamer_password: djForm.password,
                    display_name: djForm.displayName || djForm.username,
                    is_active: djForm.isActive
                })
            })
            if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to create DJ') }
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) setStreamers(await streamersRes.json())
            setIsAddDJOpen(false)
            setDJForm({ username: '', password: '', displayName: '', isActive: true })
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditDJ = async () => {
        if (!editingDJ) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/azuracast/streamers/${editingDJ.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: djForm.displayName || editingDJ.streamer_username,
                    is_active: djForm.isActive,
                    ...(djForm.password ? { streamer_password: djForm.password } : {})
                })
            })
            if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to update DJ') }
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) setStreamers(await streamersRes.json())
            setIsEditDJOpen(false)
            setEditingDJ(null)
            setDJForm({ username: '', password: '', displayName: '', isActive: true })
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const openEditDJ = (streamer: Streamer) => {
        setEditingDJ(streamer)
        setDJForm({ username: streamer.streamer_username, password: '', displayName: streamer.display_name || '', isActive: streamer.is_active })
        setIsEditDJOpen(true)
    }

    const handleDeleteDJ = async (id: number) => {
        if (!confirm('Delete this DJ? This will remove all their schedules too.')) return
        try {
            const res = await fetch(`/api/azuracast/streamers/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete DJ')
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) setStreamers(await streamersRes.json())
        } catch (err: any) {
            alert(err.message)
        }
    }

    const getAllScheduleSlots = () => {
        const slots: { streamer: Streamer; schedule: ScheduleItem; day: number }[] = []
        streamers.forEach(streamer => {
            streamer.schedule.forEach(schedule => {
                schedule.days.forEach(day => {
                    slots.push({ streamer, schedule, day })
                })
            })
        })
        return slots
    }

    const refreshStreamers = async () => {
        setRefreshing(r => ({ ...r, schedule: true }))
        try {
            const res = await fetch('/api/azuracast/streamers')
            if (res.ok) setStreamers(await res.json())
        } catch (err: any) {
            console.error('Failed to refresh streamers:', err)
        } finally {
            setRefreshing(r => ({ ...r, schedule: false }))
        }
    }

    const refreshBroadcasts = async () => {
        setRefreshing(r => ({ ...r, history: true }))
        try {
            const res = await fetch('/api/azuracast/broadcasts')
            if (res.ok) setBroadcasts(await res.json())
        } catch (err: any) {
            console.error('Failed to refresh broadcasts:', err)
        } finally {
            setRefreshing(r => ({ ...r, history: false }))
        }
    }

    // Day selection helpers (AzuraCast ISO: 1=Mon...7=Sun)
    const selectAllDays = () => setScheduleForm(f => ({ ...f, days: [1, 2, 3, 4, 5, 6, 7] }))
    const selectWeekdays = () => setScheduleForm(f => ({ ...f, days: [1, 2, 3, 4, 5] }))
    const selectWeekends = () => setScheduleForm(f => ({ ...f, days: [6, 7] }))
    const clearDays = () => setScheduleForm(f => ({ ...f, days: [] }))

    const getActiveDJCount = () => streamers.filter(s => s.is_active).length
    const getTotalScheduleCount = () => streamers.reduce((acc, s) => acc + s.schedule.length, 0)

    useEffect(() => {
        const fetchNowPlaying = async () => {
            try {
                const res = await fetch('/api/azuracast/nowplaying')
                if (!res.ok) throw new Error('Failed to fetch')
                setNowPlaying(await res.json())
                setErrors(e => ({ ...e, live: '' }))
            } catch (err: any) {
                setErrors(e => ({ ...e, live: err.message }))
            } finally {
                setLoading(l => ({ ...l, live: false }))
            }
        }

        const fetchUpcoming = async () => {
            try {
                const res = await fetch('/api/azuracast/listeners')
                if (!res.ok) return
                // Also fetch station schedule for upcoming shows
                const schedRes = await fetch('/api/azuracast/nowplaying')
                if (!schedRes.ok) return
            } catch { /* ignore */ }
        }

        const fetchStreamers = async () => {
            try {
                const res = await fetch('/api/azuracast/streamers')
                if (!res.ok) throw new Error('Failed to fetch')
                setStreamers(await res.json())
                setErrors(e => ({ ...e, schedule: '' }))
            } catch (err: any) {
                setErrors(e => ({ ...e, schedule: err.message }))
            } finally {
                setLoading(l => ({ ...l, schedule: false }))
            }
        }

        const fetchBroadcasts = async () => {
            try {
                const res = await fetch('/api/azuracast/broadcasts')
                if (!res.ok) throw new Error('Failed to fetch')
                setBroadcasts(await res.json())
                setErrors(e => ({ ...e, history: '' }))
            } catch (err: any) {
                setErrors(e => ({ ...e, history: err.message }))
            } finally {
                setLoading(l => ({ ...l, history: false }))
            }
        }

        // Fetch upcoming from station schedule endpoint
        const fetchUpcomingShows = async () => {
            try {
                const res = await fetch('/api/azuracast/station-schedule')
                if (!res.ok) return
                setUpcoming(await res.json())
            } catch { /* ignore - endpoint may not exist yet */ }
        }

        fetchNowPlaying()
        fetchStreamers()
        fetchBroadcasts()
        fetchUpcomingShows()

        const interval = setInterval(fetchNowPlaying, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <Tabs defaultValue="live" className="space-y-6">
            <TabsList className="bg-slate-900/50 border border-slate-800 w-full sm:w-auto">
                <TabsTrigger value="live" className="text-slate-400 hover:text-white data-[state=active]:bg-slate-800 data-[state=active]:text-white flex-1 sm:flex-none">
                    <Radio className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Live Status</span>
                    <span className="sm:hidden ml-1.5">Live</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-slate-400 hover:text-white data-[state=active]:bg-slate-800 data-[state=active]:text-white flex-1 sm:flex-none">
                    <Calendar className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">DJ Schedule</span>
                    <span className="sm:hidden ml-1.5">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="text-slate-400 hover:text-white data-[state=active]:bg-slate-800 data-[state=active]:text-white flex-1 sm:flex-none">
                    <History className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Broadcast History</span>
                    <span className="sm:hidden ml-1.5">History</span>
                </TabsTrigger>
            </TabsList>

            {/* ─── Live Status Tab ─── */}
            <TabsContent value="live" className="space-y-6">
                {loading.live ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : errors.live ? (
                    <Card className="bg-red-950/20 border-red-900">
                        <CardContent className="flex items-center gap-3 py-6">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <p className="text-red-300">{errors.live}</p>
                        </CardContent>
                    </Card>
                ) : nowPlaying ? (
                    <>
                        {/* On-Air Banner */}
                        <Card className={`border overflow-hidden ${nowPlaying.live.is_live
                            ? 'bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border-emerald-700/50'
                            : 'bg-slate-900/50 border-slate-800'
                        }`}>
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${
                                        nowPlaying.live.is_live
                                            ? 'bg-emerald-600/20 border-2 border-emerald-500/30'
                                            : 'bg-slate-800 border-2 border-slate-700'
                                    }`}>
                                        <Mic className={`h-7 w-7 ${nowPlaying.live.is_live ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {nowPlaying.live.is_live ? (
                                                <>
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Now</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">AutoDJ</span>
                                            )}
                                        </div>
                                        <p className={`text-xl sm:text-2xl font-bold truncate ${
                                            nowPlaying.live.is_live ? 'text-white' : 'text-slate-300'
                                        }`}>
                                            {nowPlaying.live.is_live ? nowPlaying.live.streamer_name : 'No live DJ'}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {nowPlaying.live.is_live ? 'Currently broadcasting live' : 'Station running on auto-rotation'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Now Playing + Listeners */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-4 sm:p-5">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Music className="h-3.5 w-3.5 text-indigo-400" />
                                        Now Playing
                                    </p>
                                    <div className="flex gap-3">
                                        {nowPlaying.now_playing.song.art && (
                                            <img
                                                src={nowPlaying.now_playing.song.art}
                                                alt="Album art"
                                                className="w-14 h-14 rounded-lg object-cover shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate text-sm">{nowPlaying.now_playing.song.title || 'Unknown'}</p>
                                            <p className="text-slate-400 text-xs truncate mt-0.5">{nowPlaying.now_playing.song.artist || 'Unknown Artist'}</p>
                                            {nowPlaying.now_playing.is_request && (
                                                <Badge variant="outline" className="mt-1.5 text-[10px] border-amber-600/50 text-amber-400">Request</Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-4 sm:p-5">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-cyan-400" />
                                        Listeners
                                    </p>
                                    <div className="flex items-end gap-6">
                                        <div>
                                            <p className="text-3xl font-bold text-white leading-none">{nowPlaying.listeners.current}</p>
                                            <p className="text-slate-500 text-xs mt-1">Current</p>
                                        </div>
                                        <div>
                                            <p className="text-xl text-slate-300 leading-none">{nowPlaying.listeners.unique}</p>
                                            <p className="text-slate-500 text-xs mt-1">Unique</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Upcoming Shows */}
                        {upcoming.length > 0 && (
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-4 sm:p-5">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                                        Upcoming Shows
                                    </p>
                                    <div className="space-y-2">
                                        {upcoming.map((show, idx) => {
                                            const isToday = new Date(show.start).toDateString() === new Date().toDateString()
                                            return (
                                                <div key={`${show.id}-${idx}`} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                                                    isToday ? 'bg-amber-950/20 border border-amber-700/30' : 'bg-slate-800/50'
                                                }`}>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                                            <Mic className="h-4 w-4 text-indigo-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{show.name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatShowDate(show.start)} &middot; {formatShowTime(show.start)} – {formatShowTime(show.end)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`shrink-0 ml-3 text-xs font-medium px-2 py-1 rounded-full ${
                                                        isToday ? 'bg-amber-950/50 text-amber-400' : 'bg-slate-800 text-slate-500'
                                                    }`}>
                                                        {timeUntil(show.start)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Song History */}
                        {nowPlaying.song_history.length > 0 && (
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-4 sm:p-5">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Recent Tracks</p>
                                    <div className="divide-y divide-slate-800/50">
                                        {nowPlaying.song_history.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                                                {item.song?.art && (
                                                    <img src={item.song.art} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-200 truncate">{item.song?.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">{item.song?.artist}</p>
                                                </div>
                                                <span className="text-xs text-slate-600 shrink-0">
                                                    {new Date(item.played_at * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : null}
            </TabsContent>

            {/* ─── DJ Schedule Tab ─── */}
            <TabsContent value="schedule" className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-3 text-xs ${scheduleView === 'list'
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                onClick={() => setScheduleView('list')}
                            >
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                DJs
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-3 text-xs ${scheduleView === 'calendar'
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                onClick={() => setScheduleView('calendar')}
                            >
                                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                Calendar
                            </Button>
                        </div>
                        {!loading.schedule && streamers.length > 0 && (
                            <span className="hidden sm:inline text-xs text-slate-600">
                                {getActiveDJCount()} active &middot; {getTotalScheduleCount()} schedules
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={refreshStreamers}
                            disabled={refreshing.schedule}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing.schedule ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-slate-300 hover:text-white bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700 hover:border-slate-600"
                            onClick={() => setIsAddDJOpen(true)}
                        >
                            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                            Add DJ
                        </Button>
                    </div>
                </div>

                {loading.schedule ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : errors.schedule ? (
                    <Card className="bg-red-950/20 border-red-900">
                        <CardContent className="flex items-center gap-3 py-6">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <p className="text-red-300">{errors.schedule}</p>
                        </CardContent>
                    </Card>
                ) : streamers.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="text-center py-12">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                            <p className="text-slate-400">No DJs configured</p>
                            <p className="text-slate-500 text-sm mt-1">Click &ldquo;Add DJ&rdquo; to create one</p>
                        </CardContent>
                    </Card>
                ) : scheduleView === 'calendar' ? (
                    /* Calendar View */
                    getAllScheduleSlots().length === 0 ? (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardContent className="text-center py-12">
                                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                                <p className="text-slate-400">No schedules configured</p>
                                <p className="text-slate-500 text-sm mt-1">Switch to DJs view to add schedules</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-slate-200">Weekly Schedule</CardTitle>
                                <CardDescription>All scheduled DJ broadcasts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                                    <div className="min-w-[640px]">
                                        <div className="grid grid-cols-7 gap-1.5 mb-3">
                                            {DAYS_JS.map((day, idx) => {
                                                const isToday = idx === new Date().getDay()
                                                return (
                                                    <div key={day} className={`text-center py-1.5 rounded-lg text-xs font-semibold ${
                                                        isToday ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500'
                                                    }`}>
                                                        {day}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1.5">
                                            {DAYS_JS.map((_, dayIdx) => {
                                                const daySlots = getAllScheduleSlots().filter(s => isoToJsDay(s.day) === dayIdx)
                                                    .sort((a, b) => a.schedule.start_time - b.schedule.start_time)
                                                const isToday = dayIdx === new Date().getDay()
                                                return (
                                                    <div key={dayIdx} className={`space-y-1.5 min-h-[80px] rounded-lg p-1.5 ${
                                                        isToday ? 'bg-indigo-950/20 border border-indigo-900/30' : 'bg-slate-800/20'
                                                    }`}>
                                                        {daySlots.length === 0 ? (
                                                            <div className="h-full flex items-center justify-center py-4">
                                                                <span className="text-slate-700 text-[10px]">—</span>
                                                            </div>
                                                        ) : daySlots.map((slot, i) => (
                                                            <div
                                                                key={`${slot.streamer.id}-${slot.schedule.id}-${i}`}
                                                                className={`rounded-md p-1.5 text-[11px] ${
                                                                    slot.streamer.is_active
                                                                        ? 'bg-indigo-600/15 border border-indigo-600/30'
                                                                        : 'bg-slate-800/50 border border-slate-700/50'
                                                                }`}
                                                            >
                                                                <p className={`font-medium truncate ${slot.streamer.is_active ? 'text-indigo-300' : 'text-slate-500'}`}>
                                                                    {slot.streamer.display_name || slot.streamer.streamer_username}
                                                                </p>
                                                                <p className="text-slate-500 mt-0.5 leading-tight">
                                                                    {formatTime(slot.schedule.start_time)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    /* List View */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {streamers.map((streamer) => (
                            <Card key={streamer.id} className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-4 sm:p-5">
                                    {/* DJ Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                streamer.is_active ? 'bg-indigo-600/15 border border-indigo-600/30' : 'bg-slate-800 border border-slate-700'
                                            }`}>
                                                <Mic className={`h-4 w-4 ${streamer.is_active ? 'text-indigo-400' : 'text-slate-500'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-200 truncate">
                                                    {streamer.display_name || streamer.streamer_username}
                                                </p>
                                                <p className="text-xs text-slate-600">@{streamer.streamer_username}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <Badge className={`text-[10px] ${
                                                streamer.is_active
                                                    ? 'bg-emerald-600/15 text-emerald-400 border-emerald-600/30'
                                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                            }`}>
                                                {streamer.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Button variant="ghost" size="icon"
                                                className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-800"
                                                onClick={() => openEditDJ(streamer)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon"
                                                className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                                                onClick={() => handleDeleteDJ(streamer.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Schedule Items */}
                                    {streamer.schedule.length > 0 ? (
                                        <div className="space-y-1.5 mb-3">
                                            {streamer.schedule.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3 text-slate-600 shrink-0" />
                                                            <span className="text-xs text-slate-300 whitespace-nowrap">
                                                                {formatTime(item.start_time)} – {formatTime(item.end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {item.days.map(d => (
                                                                <span key={d} className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">
                                                                    {DAYS_ISO[d]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0 ml-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30"
                                                        onClick={() => handleDeleteSchedule(streamer.id, item.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-600 mb-3 py-2">No schedule set</p>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 text-xs text-slate-400 bg-slate-800/30 border border-slate-700/40 hover:text-white hover:bg-slate-700 hover:border-slate-600"
                                        onClick={() => openAddSchedule(streamer)}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Add Schedule
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add Schedule Dialog */}
                <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                Add Schedule for {selectedStreamer?.display_name || selectedStreamer?.streamer_username}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime" className="text-slate-300 text-xs">Start Time</Label>
                                    <Input id="startTime" type="time" value={scheduleForm.startTime}
                                        onChange={(e) => setScheduleForm(f => ({ ...f, startTime: e.target.value }))}
                                        className="bg-slate-800/50 border-slate-700 text-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime" className="text-slate-300 text-xs">End Time</Label>
                                    <Input id="endTime" type="time" value={scheduleForm.endTime}
                                        onChange={(e) => setScheduleForm(f => ({ ...f, endTime: e.target.value }))}
                                        className="bg-slate-800/50 border-slate-700 text-slate-100"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 text-xs">Days</Label>
                                    <div className="flex items-center gap-1">
                                        {[
                                            { label: 'All', fn: selectAllDays },
                                            { label: 'Weekdays', fn: selectWeekdays },
                                            { label: 'Weekends', fn: selectWeekends },
                                            { label: 'Clear', fn: clearDays },
                                        ].map(({ label, fn }) => (
                                            <Button key={label} type="button" variant="ghost" size="sm"
                                                className="h-6 px-2 text-[10px] text-slate-500 hover:text-white hover:bg-slate-800"
                                                onClick={fn}
                                            >{label}</Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {[1, 2, 3, 4, 5, 6, 7].map((isoDay) => (
                                        <Button key={isoDay} type="button" variant="ghost" size="sm"
                                            className={`h-8 w-12 text-xs ${
                                                scheduleForm.days.includes(isoDay)
                                                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/40 hover:bg-indigo-600/30'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                                            }`}
                                            onClick={() => toggleDay(isoDay)}
                                        >
                                            {DAYS_ISO[isoDay]}
                                        </Button>
                                    ))}
                                </div>
                                {scheduleForm.days.length === 0 && (
                                    <p className="text-[11px] text-amber-400/70">Select at least one day</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="mt-6 gap-2">
                            <Button variant="ghost" onClick={() => setIsAddScheduleOpen(false)}
                                className="text-slate-400 hover:text-white hover:bg-slate-800">
                                Cancel
                            </Button>
                            <Button variant="ghost" onClick={handleAddSchedule}
                                disabled={submitting || scheduleForm.days.length === 0}
                                className="bg-indigo-600/20 text-indigo-300 border border-indigo-600/40 hover:bg-indigo-600/30">
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Add Schedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add DJ Dialog */}
                <Dialog open={isAddDJOpen} onOpenChange={setIsAddDJOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New DJ</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="djUsername" className="text-slate-300 text-xs">Username *</Label>
                                <Input id="djUsername" value={djForm.username}
                                    onChange={(e) => setDJForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder="dj_username"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="djPassword" className="text-slate-300 text-xs">Password *</Label>
                                <Input id="djPassword" type="password" value={djForm.password}
                                    onChange={(e) => setDJForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Stream password"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="djDisplayName" className="text-slate-300 text-xs">Display Name</Label>
                                <Input id="djDisplayName" value={djForm.displayName}
                                    onChange={(e) => setDJForm(f => ({ ...f, displayName: e.target.value }))}
                                    placeholder="DJ Name"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="ghost" size="sm"
                                    className={djForm.isActive
                                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/25'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}
                                    onClick={() => setDJForm(f => ({ ...f, isActive: !f.isActive }))}
                                >
                                    {djForm.isActive ? 'Active' : 'Inactive'}
                                </Button>
                                <span className="text-slate-500 text-xs">
                                    {djForm.isActive ? 'DJ can broadcast' : 'DJ cannot broadcast'}
                                </span>
                            </div>
                        </div>
                        <DialogFooter className="mt-6 gap-2">
                            <Button variant="ghost" onClick={() => { setIsAddDJOpen(false); setDJForm({ username: '', password: '', displayName: '', isActive: true }) }}
                                className="text-slate-400 hover:text-white hover:bg-slate-800">
                                Cancel
                            </Button>
                            <Button variant="ghost" onClick={handleAddDJ}
                                disabled={submitting || !djForm.username || !djForm.password}
                                className="bg-indigo-600/20 text-indigo-300 border border-indigo-600/40 hover:bg-indigo-600/30">
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Add DJ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit DJ Dialog */}
                <Dialog open={isEditDJOpen} onOpenChange={setIsEditDJOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit DJ: {editingDJ?.display_name || editingDJ?.streamer_username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="editDjDisplayName" className="text-slate-300 text-xs">Display Name</Label>
                                <Input id="editDjDisplayName" value={djForm.displayName}
                                    onChange={(e) => setDJForm(f => ({ ...f, displayName: e.target.value }))}
                                    placeholder="DJ Name"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editDjPassword" className="text-slate-300 text-xs">New Password (leave blank to keep current)</Label>
                                <Input id="editDjPassword" type="password" value={djForm.password}
                                    onChange={(e) => setDJForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="New stream password"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="ghost" size="sm"
                                    className={djForm.isActive
                                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/25'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}
                                    onClick={() => setDJForm(f => ({ ...f, isActive: !f.isActive }))}
                                >
                                    {djForm.isActive ? 'Active' : 'Inactive'}
                                </Button>
                                <span className="text-slate-500 text-xs">
                                    {djForm.isActive ? 'DJ can broadcast' : 'DJ cannot broadcast'}
                                </span>
                            </div>
                        </div>
                        <DialogFooter className="mt-6 gap-2">
                            <Button variant="ghost" onClick={() => { setIsEditDJOpen(false); setEditingDJ(null); setDJForm({ username: '', password: '', displayName: '', isActive: true }) }}
                                className="text-slate-400 hover:text-white hover:bg-slate-800">
                                Cancel
                            </Button>
                            <Button variant="ghost" onClick={handleEditDJ} disabled={submitting}
                                className="bg-indigo-600/20 text-indigo-300 border border-indigo-600/40 hover:bg-indigo-600/30">
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* ─── Broadcast History Tab ─── */}
            <TabsContent value="history" className="space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                        {!loading.history && broadcasts.length > 0 && `${broadcasts.length} broadcast${broadcasts.length !== 1 ? 's' : ''}`}
                    </span>
                    <Button variant="ghost" size="sm"
                        className="h-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={refreshBroadcasts} disabled={refreshing.history}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing.history ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {loading.history ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : errors.history ? (
                    <Card className="bg-red-950/20 border-red-900">
                        <CardContent className="flex items-center gap-3 py-6">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <p className="text-red-300">{errors.history}</p>
                        </CardContent>
                    </Card>
                ) : broadcasts.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="text-center py-12">
                            <History className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                            <p className="text-slate-400">No broadcast history</p>
                            <p className="text-slate-500 text-sm mt-1">Past broadcasts will appear here once DJs go live</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {broadcasts.map((broadcast) => {
                            const isOngoing = !broadcast.timestamp_end
                            return (
                                <Card key={broadcast.id} className={`border overflow-hidden ${
                                    isOngoing
                                        ? 'bg-emerald-950/20 border-emerald-700/40'
                                        : 'bg-slate-900/50 border-slate-800'
                                }`}>
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            {/* Left: Avatar + Info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isOngoing ? 'bg-emerald-600/20' : 'bg-indigo-600/15'
                                                }`}>
                                                    <Mic className={`h-4 w-4 ${isOngoing ? 'text-emerald-400' : 'text-indigo-400'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-slate-200 truncate">{broadcast.streamer_name}</p>
                                                        {isOngoing && (
                                                            <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">LIVE</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {getRelativeDate(broadcast.timestamp_start)}
                                                        {' · '}
                                                        {formatTimeRange(broadcast.timestamp_start, broadcast.timestamp_end)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Duration + Date */}
                                            <div className="flex items-center gap-2 sm:flex-col sm:items-end pl-13 sm:pl-0">
                                                <Badge variant="outline" className={`text-[10px] ${
                                                    isOngoing ? 'border-emerald-600/50 text-emerald-400' : 'border-slate-700 text-slate-500'
                                                }`}>
                                                    <Clock className="h-2.5 w-2.5 mr-1" />
                                                    {formatDuration(broadcast.timestamp_start, broadcast.timestamp_end)}
                                                </Badge>
                                                {broadcast.timestamp_start && (
                                                    <p className="text-[10px] text-slate-600">
                                                        {formatDate(broadcast.timestamp_start)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}
