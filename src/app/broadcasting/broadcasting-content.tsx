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
    timestamp_start: number
    timestamp_end: number | null
    recording: any
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function formatDuration(startTimestamp: number | null, endTimestamp: number | null): string {
    if (!startTimestamp) return 'Unknown'
    if (!endTimestamp) return 'Ongoing'
    const durationSeconds = endTimestamp - startTimestamp
    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.floor((durationSeconds % 3600) / 60)
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'Unknown date'
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) return 'Unknown date'
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function formatTimeRange(startTimestamp: number | null, endTimestamp: number | null): string {
    if (!startTimestamp) return 'Unknown'
    const startDate = new Date(startTimestamp * 1000)
    if (isNaN(startDate.getTime())) return 'Unknown'
    
    const startTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    
    if (!endTimestamp) return `${startTime} - Ongoing`
    
    const endDate = new Date(endTimestamp * 1000)
    const endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    
    return `${startTime} - ${endTime}`
}

function getRelativeDate(timestamp: number | null): string {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) return ''
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const broadcastDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (broadcastDate.getTime() === today.getTime()) return 'Today'
    if (broadcastDate.getTime() === yesterday.getTime()) return 'Yesterday'
    
    const diffDays = Math.floor((today.getTime() - broadcastDate.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BroadcastingContent() {
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null)
    const [streamers, setStreamers] = useState<Streamer[]>([])
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
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

    const timeToSeconds = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 3600 + minutes * 60
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
                    start_time: timeToSeconds(scheduleForm.startTime),
                    end_time: timeToSeconds(scheduleForm.endTime),
                    days: scheduleForm.days
                })
            })
            
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create schedule')
            }
            
            // Refresh streamers data
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) {
                setStreamers(await streamersRes.json())
            }
            
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
            const res = await fetch(`/api/azuracast/schedule?streamerId=${streamerId}&scheduleId=${scheduleId}`, {
                method: 'DELETE'
            })
            
            if (!res.ok) throw new Error('Failed to delete schedule')
            
            // Refresh streamers data
            const streamersRes = await fetch('/api/azuracast/streamers')
            if (streamersRes.ok) {
                setStreamers(await streamersRes.json())
            }
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
            
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create DJ')
            }
            
            // Refresh streamers
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
            
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to update DJ')
            }
            
            // Refresh streamers
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
        setDJForm({
            username: streamer.streamer_username,
            password: '',
            displayName: streamer.display_name || '',
            isActive: streamer.is_active
        })
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

    // Get all schedule slots for calendar view
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

    // Refresh functions
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

    // Day selection helpers for schedule dialog
    const selectAllDays = () => setScheduleForm(f => ({ ...f, days: [0, 1, 2, 3, 4, 5, 6] }))
    const selectWeekdays = () => setScheduleForm(f => ({ ...f, days: [1, 2, 3, 4, 5] }))
    const selectWeekends = () => setScheduleForm(f => ({ ...f, days: [0, 6] }))
    const clearDays = () => setScheduleForm(f => ({ ...f, days: [] }))

    // Get total schedule count
    const getTotalScheduleCount = () => {
        return streamers.reduce((acc, s) => acc + s.schedule.length, 0)
    }

    // Get active DJ count
    const getActiveDJCount = () => {
        return streamers.filter(s => s.is_active).length
    }

    useEffect(() => {
        // Fetch Now Playing
        const fetchNowPlaying = async () => {
            try {
                const res = await fetch('/api/azuracast/nowplaying')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                setNowPlaying(data)
                setErrors(e => ({ ...e, live: '' }))
            } catch (err: any) {
                setErrors(e => ({ ...e, live: err.message }))
            } finally {
                setLoading(l => ({ ...l, live: false }))
            }
        }

        // Fetch Streamers with schedules
        const fetchStreamers = async () => {
            try {
                const res = await fetch('/api/azuracast/streamers')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                setStreamers(data)
                setErrors(e => ({ ...e, schedule: '' }))
            } catch (err: any) {
                setErrors(e => ({ ...e, schedule: err.message }))
            } finally {
                setLoading(l => ({ ...l, schedule: false }))
            }
        }

        // Fetch Broadcasts history
        const fetchBroadcasts = async () => {
            try {
                const res = await fetch('/api/azuracast/broadcasts')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                setBroadcasts(data)
                setErrors(e => ({ ...e, history: '' }))
            } catch (err: any) {
                setErrors(e => ({ ...e, history: err.message }))
            } finally {
                setLoading(l => ({ ...l, history: false }))
            }
        }

        fetchNowPlaying()
        fetchStreamers()
        fetchBroadcasts()

        // Auto-refresh now playing every 15 seconds
        const interval = setInterval(fetchNowPlaying, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <Tabs defaultValue="live" className="space-y-6">
            <TabsList className="bg-slate-900/50 border border-slate-800">
                <TabsTrigger value="live" className="text-slate-400 hover:text-white data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <Radio className="h-4 w-4 mr-1.5" />
                    Live Status
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-slate-400 hover:text-white data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    DJ Schedule
                </TabsTrigger>
                <TabsTrigger value="history" className="text-slate-400 hover:text-white data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <History className="h-4 w-4 mr-1.5" />
                    Broadcast History
                </TabsTrigger>
            </TabsList>

            {/* Live Status Tab */}
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
                        {/* Live DJ Status */}
                        <Card className={`border ${nowPlaying.live.is_live ? 'bg-emerald-950/30 border-emerald-700' : 'bg-slate-900/50 border-slate-800'}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                                        <Mic className="h-5 w-5" />
                                        On-Air Status
                                    </CardTitle>
                                    <Badge className={nowPlaying.live.is_live ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}>
                                        {nowPlaying.live.is_live ? '● LIVE' : 'AutoDJ'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {nowPlaying.live.is_live ? (
                                    <div className="space-y-2">
                                        <p className="text-2xl font-bold text-white">{nowPlaying.live.streamer_name}</p>
                                        <p className="text-slate-400 text-sm">Currently broadcasting live</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xl text-slate-300">No live DJ</p>
                                        <p className="text-slate-500 text-sm">Station is running on AutoDJ</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Now Playing & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                                        <Music className="h-4 w-4 text-indigo-400" />
                                        Now Playing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-4">
                                    {nowPlaying.now_playing.song.art && (
                                        <img 
                                            src={nowPlaying.now_playing.song.art} 
                                            alt="Album art"
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{nowPlaying.now_playing.song.title || 'Unknown'}</p>
                                        <p className="text-slate-400 text-sm truncate">{nowPlaying.now_playing.song.artist || 'Unknown Artist'}</p>
                                        {nowPlaying.now_playing.is_request && (
                                            <Badge variant="outline" className="mt-2 text-xs border-amber-600 text-amber-400">Request</Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-cyan-400" />
                                        Listeners
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-4">
                                        <div>
                                            <p className="text-3xl font-bold text-white">{nowPlaying.listeners.current}</p>
                                            <p className="text-slate-500 text-xs">Current</p>
                                        </div>
                                        <div>
                                            <p className="text-xl text-slate-300">{nowPlaying.listeners.unique}</p>
                                            <p className="text-slate-500 text-xs">Unique</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Song History */}
                        {nowPlaying.song_history.length > 0 && (
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-slate-200">Recent Tracks</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {nowPlaying.song_history.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 text-sm">
                                                <span className="text-slate-500 w-16">
                                                    {new Date(item.played_at * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-slate-300 truncate">{item.song?.title}</span>
                                                <span className="text-slate-500 truncate">— {item.song?.artist}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : null}
            </TabsContent>

            {/* DJ Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={scheduleView === 'list' 
                                    ? 'bg-slate-800 border-slate-600 text-white' 
                                    : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}
                                onClick={() => setScheduleView('list')}
                            >
                                <Users className="h-4 w-4 mr-1.5" />
                                DJs
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className={scheduleView === 'calendar' 
                                    ? 'bg-slate-800 border-slate-600 text-white' 
                                    : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}
                                onClick={() => setScheduleView('calendar')}
                            >
                                <CalendarDays className="h-4 w-4 mr-1.5" />
                                Calendar
                            </Button>
                        </div>
                        {!loading.schedule && streamers.length > 0 && (
                            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                                <span>{getActiveDJCount()} active / {streamers.length} DJs</span>
                                <span className="text-slate-700">|</span>
                                <span>{getTotalScheduleCount()} schedules</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            onClick={refreshStreamers}
                            disabled={refreshing.schedule}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing.schedule ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            onClick={() => setIsAddDJOpen(true)}
                        >
                            <UserPlus className="h-4 w-4 mr-1.5" />
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
                            <p className="text-slate-500 text-sm mt-1">Click "Add DJ" to create one</p>
                        </CardContent>
                    </Card>
                ) : scheduleView === 'calendar' ? (
                    /* Calendar View */
                    getAllScheduleSlots().length === 0 ? (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardContent className="text-center py-12">
                                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                                <p className="text-slate-400">No schedules configured</p>
                                <p className="text-slate-500 text-sm mt-1">Switch to DJs view to add schedules to your DJs</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-slate-200">Weekly Schedule</CardTitle>
                                <CardDescription>All scheduled DJ broadcasts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <div className="min-w-[700px]">
                                        {/* Day headers */}
                                        <div className="grid grid-cols-7 gap-2 mb-4">
                                            {DAYS.map((day, idx) => {
                                                const isToday = idx === new Date().getDay()
                                                return (
                                                    <div key={day} className="text-center">
                                                        <div className={`inline-flex items-center justify-center rounded-lg px-3 py-1 ${isToday ? 'bg-indigo-600/20' : ''}`}>
                                                            <p className={`text-sm font-medium ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                                {day}
                                                                {isToday && <span className="ml-1.5 text-xs text-indigo-500">(Today)</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {/* Schedule slots */}
                                        <div className="grid grid-cols-7 gap-2">
                                            {DAYS.map((_, dayIdx) => {
                                                const daySlots = getAllScheduleSlots().filter(s => s.day === dayIdx)
                                                    .sort((a, b) => a.schedule.start_time - b.schedule.start_time)
                                                const isToday = dayIdx === new Date().getDay()
                                                return (
                                                    <div key={dayIdx} className={`space-y-2 min-h-[100px] rounded-lg p-1 ${isToday ? 'bg-indigo-950/20' : ''}`}>
                                                        {daySlots.length === 0 ? (
                                                            <div className="h-full flex items-center justify-center py-4">
                                                                <span className="text-slate-700 text-xs">No shows</span>
                                                            </div>
                                                        ) : (
                                                            daySlots.map((slot, i) => (
                                                                <div 
                                                                    key={`${slot.streamer.id}-${slot.schedule.id}-${i}`}
                                                                    className={`rounded-lg p-2 text-xs ${
                                                                        slot.streamer.is_active 
                                                                            ? 'bg-indigo-600/20 border border-indigo-600/40' 
                                                                            : 'bg-slate-800/50 border border-slate-700'
                                                                    }`}
                                                                >
                                                                    <p className={`font-medium truncate ${slot.streamer.is_active ? 'text-indigo-300' : 'text-slate-400'}`}>
                                                                        {slot.streamer.display_name || slot.streamer.streamer_username}
                                                                    </p>
                                                                    <p className="text-slate-500 mt-0.5">
                                                                        {formatTime(slot.schedule.start_time)} - {formatTime(slot.schedule.end_time)}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {streamers.map((streamer) => (
                            <Card key={streamer.id} className="bg-slate-900/50 border-slate-800">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base text-slate-200">
                                            {streamer.display_name || streamer.streamer_username}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge className={streamer.is_active ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600' : 'bg-slate-700 text-slate-400'}>
                                                {streamer.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                                                onClick={() => openEditDJ(streamer)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                                                onClick={() => handleDeleteDJ(streamer.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardDescription className="text-slate-500">@{streamer.streamer_username}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {streamer.schedule.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Schedule</p>
                                            {streamer.schedule.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between text-sm bg-slate-800/50 rounded px-3 py-2 group">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className="text-slate-300">
                                                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                        </span>
                                                        <span className="text-slate-500">
                                                            {item.days.map(d => DAYS[d]).join(', ')}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                                                        onClick={() => handleDeleteSchedule(streamer.id, item.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">No schedule set</p>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                        onClick={() => openAddSchedule(streamer)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Schedule
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add Schedule Dialog */}
                <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>
                                Add Schedule for {selectedStreamer?.display_name || selectedStreamer?.streamer_username}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime" className="text-slate-200">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={scheduleForm.startTime}
                                        onChange={(e) => setScheduleForm(f => ({ ...f, startTime: e.target.value }))}
                                        className="bg-slate-800/50 border-slate-700 text-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime" className="text-slate-200">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={scheduleForm.endTime}
                                        onChange={(e) => setScheduleForm(f => ({ ...f, endTime: e.target.value }))}
                                        className="bg-slate-800/50 border-slate-700 text-slate-100"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-200">Days</Label>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                            onClick={selectAllDays}
                                        >
                                            All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                            onClick={selectWeekdays}
                                        >
                                            Weekdays
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                            onClick={selectWeekends}
                                        >
                                            Weekends
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                            onClick={clearDays}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((day, idx) => (
                                        <Button
                                            key={day}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className={`${
                                                scheduleForm.days.includes(idx)
                                                    ? 'bg-slate-700 border-slate-500 text-white hover:bg-slate-600'
                                                    : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                                            }`}
                                            onClick={() => toggleDay(idx)}
                                        >
                                            {day}
                                        </Button>
                                    ))}
                                </div>
                                {scheduleForm.days.length === 0 && (
                                    <p className="text-xs text-amber-400">Select at least one day</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddScheduleOpen(false)}
                                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleAddSchedule}
                                disabled={submitting || scheduleForm.days.length === 0}
                                className="border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Add Schedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add DJ Dialog */}
                <Dialog open={isAddDJOpen} onOpenChange={setIsAddDJOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Add New DJ</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="djUsername" className="text-slate-200">Username *</Label>
                                <Input
                                    id="djUsername"
                                    value={djForm.username}
                                    onChange={(e) => setDJForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder="dj_username"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="djPassword" className="text-slate-200">Password *</Label>
                                <Input
                                    id="djPassword"
                                    type="password"
                                    value={djForm.password}
                                    onChange={(e) => setDJForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Stream password"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="djDisplayName" className="text-slate-200">Display Name</Label>
                                <Input
                                    id="djDisplayName"
                                    value={djForm.displayName}
                                    onChange={(e) => setDJForm(f => ({ ...f, displayName: e.target.value }))}
                                    placeholder="DJ Name"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={djForm.isActive 
                                        ? 'bg-slate-700 border-emerald-600 text-emerald-400 hover:bg-slate-600' 
                                        : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}
                                    onClick={() => setDJForm(f => ({ ...f, isActive: !f.isActive }))}
                                >
                                    {djForm.isActive ? 'Active' : 'Inactive'}
                                </Button>
                                <span className="text-slate-400 text-sm">
                                    {djForm.isActive ? 'DJ can broadcast' : 'DJ cannot broadcast'}
                                </span>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddDJOpen(false)
                                    setDJForm({ username: '', password: '', displayName: '', isActive: true })
                                }}
                                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleAddDJ}
                                disabled={submitting || !djForm.username || !djForm.password}
                                className="border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Add DJ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit DJ Dialog */}
                <Dialog open={isEditDJOpen} onOpenChange={setIsEditDJOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Edit DJ: {editingDJ?.streamer_username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="editDjDisplayName" className="text-slate-200">Display Name</Label>
                                <Input
                                    id="editDjDisplayName"
                                    value={djForm.displayName}
                                    onChange={(e) => setDJForm(f => ({ ...f, displayName: e.target.value }))}
                                    placeholder="DJ Name"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editDjPassword" className="text-slate-200">New Password (leave blank to keep current)</Label>
                                <Input
                                    id="editDjPassword"
                                    type="password"
                                    value={djForm.password}
                                    onChange={(e) => setDJForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="New stream password"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={djForm.isActive 
                                        ? 'bg-slate-700 border-emerald-600 text-emerald-400 hover:bg-slate-600' 
                                        : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}
                                    onClick={() => setDJForm(f => ({ ...f, isActive: !f.isActive }))}
                                >
                                    {djForm.isActive ? 'Active' : 'Inactive'}
                                </Button>
                                <span className="text-slate-400 text-sm">
                                    {djForm.isActive ? 'DJ can broadcast' : 'DJ cannot broadcast'}
                                </span>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditDJOpen(false)
                                    setEditingDJ(null)
                                    setDJForm({ username: '', password: '', displayName: '', isActive: true })
                                }}
                                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleEditDJ}
                                disabled={submitting}
                                className="border-slate-600 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* Broadcast History Tab */}
            <TabsContent value="history" className="space-y-6">
                {/* Header with refresh */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        {!loading.history && broadcasts.length > 0 && (
                            <span>{broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''} found</span>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                        onClick={refreshBroadcasts}
                        disabled={refreshing.history}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing.history ? 'animate-spin' : ''}`} />
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
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-slate-200">Recent Broadcasts</CardTitle>
                            <CardDescription>History of live DJ sessions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {broadcasts.map((broadcast) => {
                                    const isOngoing = !broadcast.timestamp_end
                                    return (
                                        <div 
                                            key={broadcast.id} 
                                            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                                                isOngoing 
                                                    ? 'bg-emerald-950/30 border border-emerald-700' 
                                                    : 'bg-slate-800/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    isOngoing ? 'bg-emerald-600/20' : 'bg-indigo-600/20'
                                                }`}>
                                                    <Mic className={`h-5 w-5 ${isOngoing ? 'text-emerald-400' : 'text-indigo-400'}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-slate-200 font-medium">{broadcast.streamer_name}</p>
                                                        {isOngoing && (
                                                            <Badge className="bg-emerald-600 text-white text-xs py-0">
                                                                LIVE NOW
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="text-slate-400">{getRelativeDate(broadcast.timestamp_start)}</span>
                                                        <span>•</span>
                                                        <span>{formatTimeRange(broadcast.timestamp_start, broadcast.timestamp_end)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <Badge 
                                                    variant="outline" 
                                                    className={isOngoing 
                                                        ? 'border-emerald-600 text-emerald-400' 
                                                        : 'border-slate-700 text-slate-400'
                                                    }
                                                >
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatDuration(broadcast.timestamp_start, broadcast.timestamp_end)}
                                                </Badge>
                                                {broadcast.timestamp_start && (
                                                    <p className="text-xs text-slate-600">
                                                        {formatDate(broadcast.timestamp_start)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        </Tabs>
    )
}
