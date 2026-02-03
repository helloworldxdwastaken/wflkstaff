import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateUserForm, DeleteUserButton } from "@/components/admin/admin-forms"
import { SideNav } from "@/components/side-nav"

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


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <SideNav />

            <main className="pl-64">
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-8 text-white">Admin Control Center</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <CreateUserForm />
                    </div>

                    <div className="grid gap-8">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-100">User Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-slate-400">Name</TableHead>
                                            <TableHead className="text-slate-400">Email</TableHead>
                                            <TableHead className="text-slate-400">Role</TableHead>
                                            <TableHead className="text-slate-400">Timezone</TableHead>
                                            <TableHead className="text-slate-400">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user: any) => (
                                            <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium text-slate-200">{user.name}</TableCell>
                                                <TableCell className="text-slate-400">{user.email}</TableCell>
                                                <TableCell><span className="bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded text-xs">{user.role}</span></TableCell>
                                                <TableCell className="text-slate-400">{user.timezone}</TableCell>
                                                <TableCell>
                                                    <DeleteUserButton userId={user.id} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
