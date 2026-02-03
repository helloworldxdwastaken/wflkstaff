import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/settings-forms"
import { SideNav } from "@/components/side-nav"
import { prisma } from "@/lib/db"

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

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <SideNav />

            <main className="pl-64">
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-8 text-white">Account Settings</h1>
                    <div className="max-w-2xl bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                        <SettingsForm user={user} />
                    </div>
                </div>
            </main>
        </div>
    )
}
