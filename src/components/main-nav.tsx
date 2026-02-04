
import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, LayoutDashboard, Shield } from "lucide-react"

export async function MainNav() {
    const session = await auth()
    const isAdmin = session?.user?.role === 'ADMIN'

    return (
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        WFLK Portal
                    </h1>
                </Link>

                <nav className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                    </Link>

                    {isAdmin && (
                        <Link href="/admin">
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                                <Shield className="mr-2 h-4 w-4" /> Admin
                            </Button>
                        </Link>
                    )}

                    <Link href="/settings">
                        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                            <Settings className="mr-2 h-4 w-4" /> Settings
                        </Button>
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-slate-200">{session?.user?.name}</p>
                    <p className="text-xs text-slate-500">{session?.user?.role}</p>
                </div>
                <form action={async () => {
                    'use server'
                    await signOut()
                }}>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-950/30">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </header>
    )
}
