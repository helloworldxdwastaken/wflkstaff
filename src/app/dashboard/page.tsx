import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { Cloud, Vote, FolderOpen, ArrowRight } from "lucide-react"
import { SideNav } from "@/components/side-nav"
import { handleSignOut } from "@/actions/auth-actions"
import { getUnreadNotificationCount } from "@/lib/notifications"
import { AnalyticsWidget } from "@/components/dashboard/analytics-widget"
import Link from "next/link"

async function getTimeZones() {
    return prisma.user.findMany({
        select: { name: true, timezone: true, role: true, jobTitle: true }
    })
}

async function getQuickStats() {
    const [pollCount, activePolls, resourceCount] = await Promise.all([
        prisma.poll.count(),
        prisma.poll.count({ where: { isActive: true } }),
        prisma.infoItem.count()
    ])
    return { pollCount, activePolls, resourceCount }
}

export default async function DashboardPage() {
    const session = await auth()
    const users = await getTimeZones()
    const notificationCount = session?.user?.id ? await getUnreadNotificationCount(session.user.id) : 0
    const stats = await getQuickStats()

    const currentTime = (tz: string) => {
        try {
            return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return "N/A"
        }
    }

    const getOffset = (tz: string) => {
        try {
            const longOffset = new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).split(' ').pop() || ''
            return longOffset.replace('GMT', '')
        } catch (e) {
            return "?"
        }
    }

    const quickLinks = [
        { href: "/polls", icon: Vote, label: "Polls", desc: `${stats.activePolls} active`, color: "indigo" },
        { href: "/resources", icon: FolderOpen, label: "Resources", desc: `${stats.resourceCount} items`, color: "amber" },
    ]

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <SideNav 
                user={{
                    name: session?.user?.name,
                    email: session?.user?.email,
                    role: session?.user?.role
                }}
                signOutAction={handleSignOut}
                notificationCount={notificationCount}
            />

            {/* Main content with responsive padding */}
            <main className="lg:pl-64 pt-16 lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-8">
                    <header className="mb-6 lg:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                            WFLK Staff Portal
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base">Welcome back, {session?.user?.name || 'Staff Member'}</p>
                    </header>

                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                        {/* Quick Links */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {quickLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link 
                                        key={link.href} 
                                        href={link.href}
                                        className={`group bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-${link.color}-500/50 transition-all flex items-center justify-between`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-${link.color}-500/10`}>
                                                <Icon className={`h-5 w-5 text-${link.color}-400`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-200">{link.label}</p>
                                                <p className="text-xs text-slate-500">{link.desc}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </Link>
                                )
                            })}
                        </section>

                        {/* Time Zones Section */}
                        <section className="space-y-4">
                            <h2 className="text-base font-semibold text-slate-300 flex items-center gap-2">
                                <Cloud className="h-5 w-5 text-cyan-400" /> Team Time Zones
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {users.map((user: { name: string | null; timezone: string; role: string; jobTitle: string | null }) => (
                                    <div key={user.name} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-medium text-slate-200">{user.name}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                    user.role === 'ADMIN' 
                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                                        : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            {user.jobTitle && (
                                                <span className="text-xs text-slate-500">{user.jobTitle}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xl font-bold text-indigo-400">{currentTime(user.timezone)}</span>
                                            <span className="text-[10px] text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/50">
                                                {getOffset(user.timezone)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Analytics Widget */}
                        <AnalyticsWidget />
                    </div>
                </div>
            </main>
        </div>
    )
}
