'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { votePoll, closePoll, deletePoll } from '@/actions/poll-actions'
import { Check, Clock, MoreVertical, Trash2, XCircle, User } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PollOption {
    id: string
    text: string
    votes: { id: string }[]
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
    isActive: boolean
    expiresAt: Date | null
    createdAt: Date
    userVotedOptionId: string | null
    totalVotes: number
    isExpired: boolean
}

interface PollCardProps {
    poll: Poll
    currentUserId: string
    isAdmin: boolean
}

export function PollCard({ poll, currentUserId, isAdmin }: PollCardProps) {
    const [voting, setVoting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasVoted = !!poll.userVotedOptionId
    const canModify = poll.createdById === currentUserId || isAdmin
    const isClosed = !poll.isActive || poll.isExpired

    const handleVote = async (optionId: string) => {
        if (hasVoted || isClosed) return

        setVoting(true)
        setError(null)

        const result = await votePoll(poll.id, optionId)
        
        if (result.error) {
            setError(result.error)
        }
        
        setVoting(false)
    }

    const handleClose = async () => {
        if (confirm('Are you sure you want to close this poll? No more votes will be accepted.')) {
            const result = await closePoll(poll.id)
            if (result.error) {
                alert(result.error)
            }
        }
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this poll? This cannot be undone.')) {
            const result = await deletePoll(poll.id)
            if (result.error) {
                alert(result.error)
            }
        }
    }

    const getPercentage = (optionVotes: number) => {
        if (poll.totalVotes === 0) return 0
        return Math.round((optionVotes / poll.totalVotes) * 100)
    }

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
        if (seconds < 60) return 'just now'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    return (
        <Card className={`bg-slate-900/50 border-slate-800 ${!hasVoted && !isClosed ? 'border-l-4 border-l-indigo-500' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                            {poll.question}
                            {isClosed && (
                                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                                    Closed
                                </span>
                            )}
                        </CardTitle>
                        {poll.description && (
                            <p className="text-sm text-slate-400 mt-1">{poll.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {poll.createdBy.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(poll.createdAt)}
                            </span>
                            {poll.expiresAt && !poll.isExpired && (
                                <span className="text-amber-400">
                                    Expires {timeAgo(poll.expiresAt).replace('ago', 'left').replace('just now', 'soon')}
                                </span>
                            )}
                        </div>
                    </div>
                    {canModify && !isClosed && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-300">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                <DropdownMenuItem onClick={handleClose} className="cursor-pointer hover:bg-slate-800">
                                    <XCircle className="h-4 w-4 mr-2" /> Close Poll
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {error && (
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                )}
                
                {poll.options.map(option => {
                    const voteCount = option.votes.length
                    const percentage = getPercentage(voteCount)
                    const isSelected = poll.userVotedOptionId === option.id
                    const showResults = hasVoted || isClosed

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted || isClosed || voting}
                            className={`w-full text-left relative overflow-hidden rounded-lg border transition-all ${
                                isSelected
                                    ? 'border-indigo-500 bg-indigo-950/30'
                                    : hasVoted || isClosed
                                    ? 'border-slate-700 bg-slate-800/30'
                                    : 'border-slate-700 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800'
                            } ${voting ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {/* Progress bar background */}
                            {showResults && (
                                <div
                                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                        isSelected ? 'bg-indigo-500/20' : 'bg-slate-700/30'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}
                            
                            <div className="relative flex items-center justify-between p-3">
                                <div className="flex items-center gap-2">
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                                    )}
                                    <span className={`text-sm ${isSelected ? 'text-indigo-300 font-medium' : 'text-slate-300'}`}>
                                        {option.text}
                                    </span>
                                </div>
                                {showResults && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                                        <span className={`font-medium ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                                            {percentage}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}

                <div className="pt-2 text-xs text-slate-500 text-center">
                    {poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}
                </div>
            </CardContent>
        </Card>
    )
}
