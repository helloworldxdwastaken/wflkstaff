import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud } from "lucide-react"
import { SideNav } from "@/components/side-nav"
import { ResourcesManager } from "@/components/dashboard/resources-manager"
import { handleSignOut } from "@/actions/auth-actions"
import { getUnreadNotificationCount } from "@/lib/notifications"

async function getTimeZones() {
    return prisma.user.findMany({
        select: { name: true, timezone: true, role: true, jobTitle: true }
    })
}

async function getInfoItems() {
    return prisma.infoItem.findMany()
}

export default async function DashboardPage() {
    const session = await auth()
    const users = await getTimeZones()
    const infoItems = await getInfoItems()
    const notificationCount = session?.user?.id ? await getUnreadNotificationCount(session.user.id) : 0

    const currentTime = (tz: string) => {
        try {
            return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return "N/A"
        }
    }

    const getTimezoneLabel = (tz: string) => {
        const labels: Record<string, string> = {
            "UTC": "Universal Time, UTC",
            "America/New_York": "USA, New York",
            "America/Chicago": "USA, Chicago",
            "America/Denver": "USA, Denver",
            "America/Los_Angeles": "USA, Los Angeles",
            "America/Anchorage": "USA, Anchorage",
            "Pacific/Honolulu": "USA, Honolulu",
            "Europe/London": "UK, London",
            "Europe/Paris": "France, Paris",
            "Europe/Berlin": "Germany, Berlin",
            "Europe/Kiev": "Ukraine, Kyiv",
            "Asia/Dubai": "UAE, Dubai",
            "Asia/Tokyo": "Japan, Tokyo",
            "Asia/Seoul": "South Korea, Seoul",
            "Asia/Shanghai": "China, Shanghai",
            "Asia/Singapore": "Singapore, Singapore",
            "Asia/Jerusalem": "Israel, Tel Aviv",
            "Australia/Sydney": "Australia, Sydney",
            "Pacific/Auckland": "New Zealand, Auckland",
        }
        return labels[tz] || tz
    }

    const getOffset = (tz: string) => {
        try {
            const longOffset = new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).split(' ').pop() || ''
            return longOffset.replace('GMT', '')
        } catch (e) {
            return "?"
        }
    }

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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Time Zones Section */}
                        <section className="col-span-1 lg:col-span-2 space-y-4 lg:space-y-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-slate-200 flex items-center gap-2">
                                <Cloud className="h-5 w-5 text-cyan-400" /> Team Time Zones
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                                {users.map((user: { name: string | null; timezone: string; role: string; jobTitle: string | null }) => (
                                    <Card key={user.name} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                        <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                                            <CardTitle className="text-base sm:text-lg font-medium text-slate-100">{user.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                            <p className="text-2xl sm:text-3xl font-bold text-indigo-400">
                                                {currentTime(user.timezone)}
                                            </p>
                                            <div className="mt-1 flex flex-col">
                                                <p className="text-xs sm:text-sm font-medium text-slate-300">{getTimezoneLabel(user.timezone)}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/50">
                                                        {getOffset(user.timezone)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${user.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-700/30 text-slate-400'}`}>
                                                    {user.role}
                                                </span>
                                                {user.jobTitle && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 inline-block">
                                                        {user.jobTitle}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Info Panel Section */}
                        <section className="col-span-1 lg:col-span-3">
                            <ResourcesManager items={infoItems} userId={session?.user?.id || ''} />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
