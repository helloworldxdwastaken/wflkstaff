import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SideNav } from "@/components/side-nav"
import { handleSignOut } from "@/actions/auth-actions"
import { StatsContent } from "./stats-content"
import { getUnreadNotificationCount } from "@/lib/notifications"

export default async function StatsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const notificationCount = await getUnreadNotificationCount(session.user.id!)

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
                <StatsContent />
            </main>
        </div>
    )
}
