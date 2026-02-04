import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SideNav } from "@/components/side-nav"
import { handleSignOut } from "@/actions/auth-actions"
import { prisma } from "@/lib/db"
import { PollList } from "@/components/polls/poll-list"
import { CreatePollDialog } from "@/components/polls/create-poll-dialog"
import { Vote } from "lucide-react"
import { getUnreadNotificationCount } from "@/lib/notifications"

async function getPolls(userId: string) {
    const polls = await prisma.poll.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            createdBy: {
                select: { name: true, image: true }
            },
            options: {
                include: {
                    votes: true
                }
            },
            votes: {
                where: { userId },
                select: { optionId: true }
            },
            _count: {
                select: { votes: true }
            }
        }
    })

    return polls.map(poll => ({
        ...poll,
        userVotedOptionId: poll.votes[0]?.optionId || null,
        totalVotes: poll._count.votes,
        isExpired: poll.expiresAt ? poll.expiresAt < new Date() : false
    }))
}

async function getNotifications(userId: string) {
    return prisma.notification.findMany({
        where: {
            userId,
            isRead: false
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    })
}

export default async function PollsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [polls, notifications, notificationCount] = await Promise.all([
        getPolls(session.user.id),
        getNotifications(session.user.id),
        getUnreadNotificationCount(session.user.id)
    ])

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
                <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                                <Vote className="h-7 w-7 text-indigo-400" />
                                Team Polls
                            </h1>
                            <p className="text-slate-400 mt-1">Vote on team decisions together</p>
                        </div>
                        <CreatePollDialog />
                    </header>

                    {notifications.length > 0 && (
                        <div className="mb-6 p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
                            <p className="text-sm text-indigo-300">
                                You have {notifications.length} poll{notifications.length > 1 ? 's' : ''} waiting for your vote
                            </p>
                        </div>
                    )}

                    <PollList 
                        polls={polls} 
                        currentUserId={session.user.id}
                        isAdmin={session.user.role === 'ADMIN'}
                    />
                </div>
            </main>
        </div>
    )
}
