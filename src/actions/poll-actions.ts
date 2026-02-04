'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// Create a new poll
export async function createPoll(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Not authenticated' }
    }

    const question = formData.get('question') as string
    const description = formData.get('description') as string | null
    const optionsRaw = formData.get('options') as string
    const expiresIn = formData.get('expiresIn') as string | null

    if (!question || !optionsRaw) {
        return { error: 'Question and options are required' }
    }

    // Parse options (comma-separated or newline-separated)
    const options = optionsRaw
        .split(/[,\n]/)
        .map(o => o.trim())
        .filter(o => o.length > 0)

    if (options.length < 2) {
        return { error: 'At least 2 options are required' }
    }

    // Calculate expiration date
    let expiresAt: Date | null = null
    if (expiresIn) {
        const hours = parseInt(expiresIn)
        if (!isNaN(hours) && hours > 0) {
            expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
        }
    }

    try {
        const poll = await prisma.poll.create({
            data: {
                question,
                description: description || null,
                createdById: session.user.id,
                expiresAt,
                options: {
                    create: options.map(text => ({ text }))
                }
            }
        })

        // Create notifications for all users except the creator
        const users = await prisma.user.findMany({
            where: { id: { not: session.user.id } },
            select: { id: true }
        })

        if (users.length > 0) {
            await prisma.notification.createMany({
                data: users.map(user => ({
                    userId: user.id,
                    type: 'POLL_CREATED',
                    title: 'New Poll',
                    message: `"${question}" - Cast your vote!`,
                    link: `/polls`
                }))
            })
        }

        revalidatePath('/polls')
        return { success: true, pollId: poll.id }
    } catch (error) {
        console.error('Error creating poll:', error)
        return { error: 'Failed to create poll' }
    }
}

// Vote on a poll
export async function votePoll(pollId: string, optionId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Not authenticated' }
    }

    try {
        // Check if poll exists and is active
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: { options: true }
        })

        if (!poll) {
            return { error: 'Poll not found' }
        }

        if (!poll.isActive) {
            return { error: 'Poll is closed' }
        }

        if (poll.expiresAt && poll.expiresAt < new Date()) {
            return { error: 'Poll has expired' }
        }

        // Check if option belongs to this poll
        const optionExists = poll.options.some(o => o.id === optionId)
        if (!optionExists) {
            return { error: 'Invalid option' }
        }

        // Check if user already voted
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_pollId: {
                    userId: session.user.id,
                    pollId
                }
            }
        })

        if (existingVote) {
            return { error: 'You have already voted on this poll' }
        }

        // Create vote
        await prisma.vote.create({
            data: {
                userId: session.user.id,
                pollId,
                optionId
            }
        })

        // Mark any notifications for this poll as read
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                link: '/polls',
                isRead: false
            },
            data: { isRead: true }
        })

        revalidatePath('/polls')
        return { success: true }
    } catch (error) {
        console.error('Error voting:', error)
        return { error: 'Failed to submit vote' }
    }
}

// Close a poll (only creator or admin can do this)
export async function closePoll(pollId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Not authenticated' }
    }

    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId }
        })

        if (!poll) {
            return { error: 'Poll not found' }
        }

        // Only creator or admin can close
        if (poll.createdById !== session.user.id && session.user.role !== 'ADMIN') {
            return { error: 'Not authorized' }
        }

        await prisma.poll.update({
            where: { id: pollId },
            data: { isActive: false }
        })

        revalidatePath('/polls')
        return { success: true }
    } catch (error) {
        console.error('Error closing poll:', error)
        return { error: 'Failed to close poll' }
    }
}

// Delete a poll (only creator or admin can do this)
export async function deletePoll(pollId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Not authenticated' }
    }

    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId }
        })

        if (!poll) {
            return { error: 'Poll not found' }
        }

        // Only creator or admin can delete
        if (poll.createdById !== session.user.id && session.user.role !== 'ADMIN') {
            return { error: 'Not authorized' }
        }

        await prisma.poll.delete({
            where: { id: pollId }
        })

        revalidatePath('/polls')
        return { success: true }
    } catch (error) {
        console.error('Error deleting poll:', error)
        return { error: 'Failed to delete poll' }
    }
}

// Get unread notification count
export async function getUnreadNotificationCount() {
    const session = await auth()
    if (!session?.user?.id) {
        return 0
    }

    try {
        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false
            }
        })
        return count
    } catch (error) {
        console.error('Error getting notification count:', error)
        return 0
    }
}

// Mark notifications as read
export async function markNotificationsAsRead(notificationIds?: string[]) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Not authenticated' }
    }

    try {
        if (notificationIds && notificationIds.length > 0) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id
                },
                data: { isRead: true }
            })
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false
                },
                data: { isRead: true }
            })
        }

        revalidatePath('/polls')
        return { success: true }
    } catch (error) {
        console.error('Error marking notifications as read:', error)
        return { error: 'Failed to mark notifications as read' }
    }
}
