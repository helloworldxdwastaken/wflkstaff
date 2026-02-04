import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SideNav } from "@/components/side-nav"
import { handleSignOut } from "@/actions/auth-actions"
import { prisma } from "@/lib/db"
import { getUnreadNotificationCount } from "@/lib/notifications"
import { ResourcesTabs } from "@/components/resources/resources-tabs"
import { FolderOpen } from "lucide-react"

async function getInfoItems() {
    return prisma.infoItem.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export default async function ResourcesPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [items, notificationCount] = await Promise.all([
        getInfoItems(),
        getUnreadNotificationCount(session.user.id)
    ])

    // Group items by type
    const links = items.filter(item => item.type === 'LINK')
    const secrets = items.filter(item => item.type === 'SECRET')
    const files = items.filter(item => item.type === 'FILE')

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
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <FolderOpen className="h-7 w-7 text-amber-400" />
                            Team Resources
                        </h1>
                        <p className="text-slate-400 mt-1">Shared links, credentials, and files for the team</p>
                    </header>

                    <ResourcesTabs 
                        links={links}
                        secrets={secrets}
                        files={files}
                        allItems={items}
                    />
                </div>
            </main>
        </div>
    )
}
