'use client'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Area,
    AreaChart
} from 'recharts'

// Format date for display: "2026-01-15" -> "Jan 15"
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format date for tooltip: "2026-01-15" -> "January 15, 2026"
const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function DailyHitsChart({ data }: { data: { date: string, hits: number }[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatDate}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        labelFormatter={(label) => typeof label === 'string' ? formatDateLong(label) : String(label ?? '')}
                        formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'Sessions']}
                    />
                    <Area
                        type="monotone"
                        dataKey="hits"
                        stroke="#818cf8"
                        strokeWidth={2}
                        fill="url(#colorHits)"
                    />
                    <Line
                        type="monotone"
                        dataKey="hits"
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: '#818cf8', stroke: '#1e293b', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export function WeeklyHitsChart({ data }: { data: { name: string, fullDate?: string, count: number }[] }) {
    const colors = ['#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#818cf8', '#a78bfa']

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        cursor={{ fill: '#334155', opacity: 0.4 }}
                        formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'Sessions']}
                        labelFormatter={(label, payload) => {
                            const p = payload?.[0] as { payload?: { fullDate?: string } } | undefined
                            if (p?.payload?.fullDate) {
                                return formatDateLong(p.payload.fullDate)
                            }
                            return typeof label === 'string' ? label : String(label ?? '')
                        }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export function PeakHoursChart({ data, timezone }: { data: { hour: string, count: number }[], timezone?: string }) {
    // Find peak hour for highlighting
    const maxCount = Math.max(...data.map(d => d.count))
    const peakHour = data.find(d => d.count === maxCount)?.hour || ''
    const peakHourNum = parseInt(peakHour)
    
    // Format hour for display
    const formatHour = (hour: number) => {
        if (hour === 0) return '12am'
        if (hour === 12) return '12pm'
        return hour > 12 ? `${hour - 12}pm` : `${hour}am`
    }
    
    const formatHourLong = (hour: number) => {
        if (hour === 0) return '12:00 AM (Midnight)'
        if (hour === 12) return '12:00 PM (Noon)'
        return hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`
    }

    return (
        <div className="space-y-3">
            {/* Peak hour callout */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Peak hour:</span>
                <span className="font-semibold text-amber-400">{formatHourLong(peakHourNum)}</span>
                <span className="text-slate-600">({maxCount.toLocaleString()} listeners)</span>
            </div>
            
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="hour"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            interval={2}
                            tickFormatter={(value) => formatHour(parseInt(value))}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            width={40}
                        />
                        <Tooltip
                            cursor={{ fill: '#334155', opacity: 0.4 }}
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                            formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'Listeners']}
                            labelFormatter={(label) => formatHourLong(parseInt(label))}
                        />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.count === maxCount ? '#f59e0b' : '#22d3ee'} 
                                    opacity={entry.count === maxCount ? 1 : 0.7}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export function PlatformPieChart({ mobile, desktop }: { mobile: number, desktop: number }) {
    const data = [
        { name: 'Mobile', value: mobile, color: '#f472b6' }, // Pink
        { name: 'Desktop', value: desktop, color: '#38bdf8' }, // Blue
    ]

    // Handle case where both are 0
    if (mobile === 0 && desktop === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center text-slate-500 text-sm">
                No data available
            </div>
        )
    }

    return (
        <div className="h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'Sessions']}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
