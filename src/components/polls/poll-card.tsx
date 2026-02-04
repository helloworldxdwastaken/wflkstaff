'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { votePoll, closePoll, deletePoll, addComment, deleteComment, editComment, editPoll } from '@/actions/poll-actions'
import { Check, Clock, MoreVertical, Trash2, XCircle, User, MessageCircle, ChevronDown, ChevronUp, Reply, Send, Pencil, X } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface PollCardProps {
    poll: Poll
    currentUserId: string
    isAdmin: boolean
    allUsers: TeamUser[]
}

export function PollCard({ poll, currentUserId, isAdmin, allUsers }: PollCardProps) {
    const [voting, setVoting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    // Edit states
    const [editingPoll, setEditingPoll] = useState(false)
    const [editQuestion, setEditQuestion] = useState(poll.question)
    const [editDescription, setEditDescription] = useState(poll.description || '')
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [editCommentContent, setEditCommentContent] = useState('')
    const [saving, setSaving] = useState(false)

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

    const formatTimestamp = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const handleAddComment = async () => {
        if (!newComment.trim()) return
        setSubmittingComment(true)
        const result = await addComment(poll.id, newComment)
        if (result.error) {
            setError(result.error)
        } else {
            setNewComment('')
        }
        setSubmittingComment(false)
    }

    const handleAddReply = async (parentId: string) => {
        if (!replyContent.trim()) return
        setSubmittingComment(true)
        const result = await addComment(poll.id, replyContent, parentId)
        if (result.error) {
            setError(result.error)
        } else {
            setReplyContent('')
            setReplyingTo(null)
        }
        setSubmittingComment(false)
    }

    const handleDeleteComment = async (commentId: string) => {
        if (confirm('Delete this comment?')) {
            const result = await deleteComment(commentId)
            if (result.error) {
                alert(result.error)
            }
        }
    }

    const handleEditPoll = async () => {
        if (!editQuestion.trim()) return
        setSaving(true)
        const result = await editPoll(poll.id, editQuestion, editDescription || null)
        if (result.error) {
            setError(result.error)
        } else {
            setEditingPoll(false)
        }
        setSaving(false)
    }

    const startEditComment = (commentId: string, content: string) => {
        setEditingCommentId(commentId)
        setEditCommentContent(content)
    }

    const cancelEditComment = () => {
        setEditingCommentId(null)
        setEditCommentContent('')
    }

    const handleEditComment = async (commentId: string) => {
        if (!editCommentContent.trim()) return
        setSaving(true)
        const result = await editComment(commentId, editCommentContent)
        if (result.error) {
            setError(result.error)
        } else {
            setEditingCommentId(null)
            setEditCommentContent('')
        }
        setSaving(false)
    }

    return (
        <Card className={`bg-slate-900/50 border-slate-800 ${!hasVoted && !isClosed ? 'border-l-4 border-l-indigo-500' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {editingPoll ? (
                            <div className="space-y-2">
                                <Input
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    placeholder="Poll question"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                                />
                                <Textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Description (optional)"
                                    className="bg-slate-800/50 border-slate-700 text-slate-100 text-sm resize-none"
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleEditPoll}
                                        disabled={saving || !editQuestion.trim()}
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setEditingPoll(false)
                                            setEditQuestion(poll.question)
                                            setEditDescription(poll.description || '')
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="text-slate-400 hover:text-slate-200"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                                    {poll.question}
                                    {isClosed && (
                                        <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                                            Closed
                                        </span>
                                    )}
                                </CardTitle>
                                {poll.description && (
                                    <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{poll.description}</p>
                                )}
                            </>
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
                    {canModify && !isClosed && !editingPoll && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-300">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                <DropdownMenuItem onClick={() => setEditingPoll(true)} className="cursor-pointer hover:bg-slate-800">
                                    <Pencil className="h-4 w-4 mr-2" /> Edit Poll
                                </DropdownMenuItem>
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

                {/* Voters & Missing Section */}
                {(() => {
                    const missingUsers = allUsers.filter(u => !poll.voterIds.includes(u.id))
                    return (
                        <div className="pt-3 mt-3 border-t border-slate-800/50 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                            {poll.voters.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500">Voted:</span>
                                    <span className="text-slate-400">
                                        {poll.voters.map(v => v.name || 'Unknown').join(', ')}
                                    </span>
                                </div>
                            )}
                            {missingUsers.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-500">Missing:</span>
                                    <span className="text-slate-500">
                                        {missingUsers.map(u => u.name || 'Unknown').join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })()}

                {/* Comments Section */}
                <div className="pt-4 border-t border-slate-800 mt-4">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span>{poll.commentCount} comment{poll.commentCount !== 1 ? 's' : ''}</span>
                        {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showComments && (
                        <div className="mt-4 space-y-4">
                            {/* Add new comment */}
                            <div className="flex gap-2">
                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="bg-slate-800/50 border-slate-700 text-slate-100 text-sm resize-none min-h-[60px]"
                                    rows={2}
                                />
                                <Button
                                    onClick={handleAddComment}
                                    disabled={submittingComment || !newComment.trim()}
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 self-end"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Comments list */}
                            <div className="space-y-3">
                                {poll.comments.map((comment) => (
                                    <div key={comment.id} className="space-y-2">
                                        {/* Main comment */}
                                        <div className="bg-slate-800/30 rounded-lg p-3">
                                            {editingCommentId === comment.id ? (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                        className="bg-slate-800/50 border-slate-700 text-slate-100 text-sm resize-none"
                                                        rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleEditComment(comment.id)}
                                                            disabled={saving || !editCommentContent.trim()}
                                                            size="sm"
                                                            className="bg-indigo-600 hover:bg-indigo-700 h-7 text-xs"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            onClick={cancelEditComment}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-slate-400 hover:text-slate-200 h-7 text-xs"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="font-medium text-slate-300">{comment.user.name || 'Unknown'}</span>
                                                                <span className="text-slate-500">{formatTimestamp(comment.createdAt)}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {comment.userId === currentUserId && (
                                                                <button
                                                                    onClick={() => startEditComment(comment.id, comment.content)}
                                                                    className="text-slate-500 hover:text-indigo-400 p-1"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                            {(comment.userId === currentUserId || isAdmin) && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="text-slate-500 hover:text-red-400 p-1"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 mt-2"
                                                    >
                                                        <Reply className="h-3 w-3" />
                                                        Reply
                                                    </button>
                                                </>
                                            )}

                                            {/* Reply input */}
                                            {replyingTo === comment.id && editingCommentId !== comment.id && (
                                                <div className="flex gap-2 mt-2">
                                                    <Textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="bg-slate-800/50 border-slate-700 text-slate-100 text-sm resize-none min-h-[50px]"
                                                        rows={2}
                                                    />
                                                    <Button
                                                        onClick={() => handleAddReply(comment.id)}
                                                        disabled={submittingComment || !replyContent.trim()}
                                                        size="sm"
                                                        className="bg-indigo-600 hover:bg-indigo-700 self-end"
                                                    >
                                                        <Send className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Replies */}
                                        {comment.replies.length > 0 && (
                                            <div className="ml-4 pl-3 border-l-2 border-slate-700 space-y-2">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.id} className="bg-slate-800/20 rounded-lg p-2">
                                                        {editingCommentId === reply.id ? (
                                                            <div className="space-y-2">
                                                                <Textarea
                                                                    value={editCommentContent}
                                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                                    className="bg-slate-800/50 border-slate-700 text-slate-100 text-sm resize-none"
                                                                    rows={2}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        onClick={() => handleEditComment(reply.id)}
                                                                        disabled={saving || !editCommentContent.trim()}
                                                                        size="sm"
                                                                        className="bg-indigo-600 hover:bg-indigo-700 h-7 text-xs"
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        onClick={cancelEditComment}
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-slate-400 hover:text-slate-200 h-7 text-xs"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="font-medium text-slate-400">{reply.user.name || 'Unknown'}</span>
                                                                        <span className="text-slate-600">{formatTimestamp(reply.createdAt)}</span>
                                                                    </div>
                                                                    <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{reply.content}</p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {reply.userId === currentUserId && (
                                                                        <button
                                                                            onClick={() => startEditComment(reply.id, reply.content)}
                                                                            className="text-slate-500 hover:text-indigo-400 p-1"
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                    {(reply.userId === currentUserId || isAdmin) && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(reply.id)}
                                                                            className="text-slate-500 hover:text-red-400 p-1"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {poll.comments.length === 0 && (
                                    <p className="text-sm text-slate-500 text-center py-2">No comments yet. Be the first to comment!</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
