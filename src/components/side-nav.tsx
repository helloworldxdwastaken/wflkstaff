
import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, LayoutDashboard, Shield, Radio } from "lucide-react"

export async function SideNav() {
    const session = await auth()
    const isAdmin = session?.user?.role === 'ADMIN'

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between z-50">
            <div>
                <div className="mb-0 px-2">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2">
                        <Radio className="h-6 w-6 text-indigo-400" />
                        WFLK
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Staff Portal</p>
                </div>

                <nav className="space-y-2 mt-8">
                    <Link href="/dashboard" className="block">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard
                        </Button>
                    </Link>

                    {isAdmin && (
                        <Link href="/admin" className="block">
                            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                                <Shield className="mr-3 h-4 w-4" /> Admin
                            </Button>
                        </Link>
                    )}

                    <Link href="/dashboard/stats" className="block">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-3 h-4 w-4"
                            >
                                <path d="M3 3v18h18" />
                                <path d="M18 17V9" />
                                <path d="M13 17V5" />
                                <path d="M8 17v-3" />
                            </svg>
                            Analytics
                        </Button>
                    </Link>

                    <Link href="/settings" className="block">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <Settings className="mr-3 h-4 w-4" /> Settings
                        </Button>
                    </Link>
                </nav>
            </div>

            <div className="space-y-4">
                <div className="px-2 py-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm font-medium text-slate-200 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full mt-2 inline-block">
                        {session?.user?.role}
                    </span>
                </div>

                <form action={async () => {
                    'use server'
                    await signOut()
                }}>
                    <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50">
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </form>
            </div>
        </aside >
    )
}
