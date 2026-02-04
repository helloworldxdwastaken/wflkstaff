'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mic, Music, Users, Loader2, ArrowRight } from 'lucide-react'

interface NowPlayingData {
    live: { is_live: boolean; streamer_name: string | null }
    now_playing: {
        song: { title: string; artist: string; art: string }
    }
    listeners: { current: number; unique: number }
}

export function LiveStatusWidget() {
    const [data, setData] = useState<NowPlayingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/azuracast/nowplaying')
                if (!res.ok) throw new Error('Failed to fetch')
                const json = await res.json()
                setData(json)
                setError('')
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 15000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
        )
    }

    if (error || !data) {
        return null // Silently fail if the widget can't load
    }

    return (
        <Link 
            href="/broadcasting"
            className={`group block rounded-lg p-4 transition-all border ${
                data.live.is_live 
                    ? 'bg-emerald-950/30 border-emerald-700 hover:border-emerald-500' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${data.live.is_live ? 'bg-emerald-600/20' : 'bg-slate-800'}`}>
                        {data.live.is_live ? (
                            <Mic className="h-5 w-5 text-emerald-400" />
                        ) : (
                            <Music className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                    <div>
                        {data.live.is_live ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <p className="font-medium text-emerald-300">LIVE</p>
                                </div>
                                <p className="text-white font-semibold">{data.live.streamer_name}</p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium text-slate-400">AutoDJ</p>
                                <p className="text-slate-300 text-sm truncate max-w-[200px]">
                                    {data.now_playing?.song?.title || 'Unknown'}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Users className="h-4 w-4" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">{data.listeners.current}</span>
                            <span className="text-xs text-slate-500">/</span>
                            <span className="text-sm text-slate-400">{data.listeners.unique}</span>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
            </div>
        </Link>
    )
}
