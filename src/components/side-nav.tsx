'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, LayoutDashboard, Shield, Radio, Menu, X, Vote } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface SideNavProps {
    user?: {
        name?: string | null
        email?: string | null
        role?: string
    }
    signOutAction: () => Promise<void>
    notificationCount?: number
}

export function SideNav({ user, signOutAction, notificationCount = 0 }: SideNavProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const isAdmin = user?.role === 'ADMIN'

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const navLinks = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", badge: 0 },
        { href: "/polls", icon: Vote, label: "Polls", badge: notificationCount },
        ...(isAdmin ? [{ href: "/admin", icon: Shield, label: "Admin", badge: 0 }] : []),
        {
            href: "/dashboard/stats",
            icon: () => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                >
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                </svg>
            ),
            label: "Analytics",
            badge: 0
        },
        { href: "/settings", icon: Settings, label: "Settings", badge: 0 },
    ]

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-300 hover:text-white hover:bg-slate-800 mr-3"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
                <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-indigo-400" />
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        WFLK
                    </span>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between z-50
                transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div>
                    <div className="mb-0 px-2 hidden lg:block">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2">
                            <Radio className="h-6 w-6 text-indigo-400" />
                            WFLK
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Staff Portal</p>
                    </div>

                    {/* Mobile header spacer */}
                    <div className="lg:hidden h-10" />

                    <nav className="space-y-2 mt-8 lg:mt-8">
                        {navLinks.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href
                            return (
                                <Link key={link.href} href={link.href} className="block">
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start ${
                                            isActive
                                                ? 'text-white bg-slate-800'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="mr-3 h-4 w-4" /> 
                                        {link.label}
                                        {link.badge > 0 && (
                                            <span className="ml-auto bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {link.badge}
                                            </span>
                                        )}
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="space-y-4">
                    <div className="px-2 py-4 bg-slate-800/50 rounded-lg">
                        <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full mt-2 inline-block">
                            {user?.role}
                        </span>
                    </div>

                    <form action={signOutAction}>
                        <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </form>
                </div>
            </aside>
        </>
    )
}
