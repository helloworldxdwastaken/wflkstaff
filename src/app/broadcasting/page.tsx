import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SideNav } from '@/components/side-nav'
import { handleSignOut } from '@/actions/auth-actions'
import { getUnreadNotificationCount } from '@/lib/notifications'
import { BroadcastingContent } from './broadcasting-content'

export default async function BroadcastingPage() {
    const session = await auth()
    if (!session) redirect('/login')

    const notificationCount = session?.user?.id ? await getUnreadNotificationCount(session.user.id) : 0

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

            <main className="lg:pl-64 pt-16 lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-8">
                    <header className="mb-6">
                        <h1 className="text-2xl font-bold text-white">Broadcasting</h1>
                        <p className="text-slate-400 text-sm mt-1">Live status, DJ schedules, and broadcast history</p>
                    </header>
                    <BroadcastingContent />
                </div>
            </main>
        </div>
    )
}
