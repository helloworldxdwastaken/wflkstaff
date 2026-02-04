import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/settings-forms"
import { SideNav } from "@/components/side-nav"
import { prisma } from "@/lib/db"
import { handleSignOut } from "@/actions/auth-actions"
import { getUnreadNotificationCount } from "@/lib/notifications"

export default async function SettingsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user) {
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
                <div className="p-4 sm:p-6 lg:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-6 lg:mb-8 text-white">Account Settings</h1>
                    <div className="max-w-2xl">
                        <SettingsForm user={user} />
                    </div>
                </div>
            </main>
        </div>
    )
}
