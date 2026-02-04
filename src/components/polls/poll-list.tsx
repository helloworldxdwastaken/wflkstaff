'use client'

import { PollCard } from './poll-card'

interface PollOption {
    id: string
    text: string
    votes: { id: string; user: { id: string; name: string | null } }[]
}

interface CommentUser {
    id: string
    name: string | null
    image: string | null
}

interface CommentReply {
    id: string
    content: string
    createdAt: Date
    userId: string
    user: CommentUser
}

interface Comment {
    id: string
    content: string
    createdAt: Date
    userId: string
    user: CommentUser
    replies: CommentReply[]
}

interface Poll {
    id: string
    question: string
    description: string | null
    createdById: string
    createdBy: {
        name: string | null
        image: string | null
    }
    options: PollOption[]
    comments: Comment[]
    isActive: boolean
    expiresAt: Date | null
    createdAt: Date
    userVotedOptionId: string | null
    totalVotes: number
    commentCount: number
    isExpired: boolean
    voters: { id: string; name: string | null }[]
    voterIds: string[]
}

interface TeamUser {
    id: string
    name: string | null
}

interface PollListProps {
    polls: Poll[]
    currentUserId: string
    isAdmin: boolean
    allUsers: TeamUser[]
}

export function PollList({ polls, currentUserId, isAdmin, allUsers }: PollListProps) {
    if (polls.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-500">No polls yet. Create one to get started!</p>
            </div>
        )
    }

    // Separate active and closed polls
    const activePolls = polls.filter(p => p.isActive && !p.isExpired)
    const closedPolls = polls.filter(p => !p.isActive || p.isExpired)

    return (
        <div className="space-y-8">
            {activePolls.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-200">Active Polls</h2>
                    <div className="space-y-4">
                        {activePolls.map(poll => (
                            <PollCard
                                key={poll.id}
                                poll={poll}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                allUsers={allUsers}
                            />
                        ))}
                    </div>
                </div>
            )}

            {closedPolls.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-400">Closed Polls</h2>
                    <div className="space-y-4 opacity-70">
                        {closedPolls.map(poll => (
                            <PollCard
                                key={poll.id}
                                poll={poll}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                allUsers={allUsers}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
