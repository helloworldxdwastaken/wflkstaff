import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateUserForm, DeleteUserButton, EditUserButton, RoleToggle } from "@/components/admin/admin-forms"
import { SideNav } from "@/components/side-nav"
import { handleSignOut } from "@/actions/auth-actions"
import { getUnreadNotificationCount } from "@/lib/notifications"

async function getUsers() {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
}

async function getLogs() {
    return prisma.activityLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, email: true } } }
    })
}

export default async function AdminPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const users = await getUsers()
    const logs = await getLogs()
    const notificationCount = await getUnreadNotificationCount(session.user.id!)
    const currentUserId = session.user.id!

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
                    <h1 className="text-2xl sm:text-3xl font-bold mb-6 lg:mb-8 text-white">Admin Control Center</h1>

                    <div className="grid grid-cols-1 gap-6 lg:gap-8 mb-6 lg:mb-8">
                        <CreateUserForm />
                    </div>

                    <div className="grid gap-6 lg:gap-8">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-slate-100">User Management</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 sm:pt-0">
                                {/* Mobile card view */}
                                <div className="sm:hidden space-y-3 p-4 pt-0">
                                    {users.map((user: any) => (
                                        <div key={user.id} className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-200 truncate">{user.name}</p>
                                                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                                                    {user.jobTitle && (
                                                        <p className="text-xs text-slate-500 mt-0.5">{user.jobTitle}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <EditUserButton user={{
                                                        id: user.id,
                                                        name: user.name,
                                                        email: user.email,
                                                        role: user.role,
                                                        jobTitle: user.jobTitle,
                                                        timezone: user.timezone,
                                                    }} currentUserId={currentUserId} />
                                                    <DeleteUserButton userId={user.id} userName={user.name} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <RoleToggle userId={user.id} currentRole={user.role} currentUserId={currentUserId} />
                                                <span className="text-[10px] text-slate-600 px-2 py-0.5 bg-slate-800 rounded">{user.timezone}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table view */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-800 hover:bg-transparent">
                                                <TableHead className="text-slate-400">Name</TableHead>
                                                <TableHead className="text-slate-400">Email</TableHead>
                                                <TableHead className="text-slate-400">Role</TableHead>
                                                <TableHead className="text-slate-400">Job Title</TableHead>
                                                <TableHead className="text-slate-400">Timezone</TableHead>
                                                <TableHead className="text-slate-400 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user: any) => (
                                                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                                    <TableCell className="font-medium text-slate-200">{user.name}</TableCell>
                                                    <TableCell className="text-slate-400">{user.email}</TableCell>
                                                    <TableCell>
                                                        <RoleToggle userId={user.id} currentRole={user.role} currentUserId={currentUserId} />
                                                    </TableCell>
                                                    <TableCell className="text-slate-400 text-sm">{user.jobTitle || <span className="text-slate-600">—</span>}</TableCell>
                                                    <TableCell className="text-slate-400 text-sm">{user.timezone}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <EditUserButton user={{
                                                                id: user.id,
                                                                name: user.name,
                                                                email: user.email,
                                                                role: user.role,
                                                                jobTitle: user.jobTitle,
                                                                timezone: user.timezone,
                                                            }} currentUserId={currentUserId} />
                                                            <DeleteUserButton userId={user.id} userName={user.name} />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-slate-100">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 sm:pt-0">
                                {/* Mobile card view */}
                                <div className="sm:hidden space-y-3 p-4 pt-0">
                                    {logs.map((log: any) => (
                                        <div key={log.id} className="bg-slate-800/50 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium text-slate-200">{log.user.name || log.user.email}</p>
                                                <p className="text-slate-500 text-xs">{log.timestamp.toLocaleString()}</p>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-1">{log.action}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table view */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-800 hover:bg-transparent">
                                                <TableHead className="text-slate-400">User</TableHead>
                                                <TableHead className="text-slate-400">Action</TableHead>
                                                <TableHead className="text-slate-400">Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.map((log: any) => (
                                                <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                                                    <TableCell className="font-medium text-slate-200">{log.user.name || log.user.email}</TableCell>
                                                    <TableCell className="text-slate-400">{log.action}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs">{log.timestamp.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
