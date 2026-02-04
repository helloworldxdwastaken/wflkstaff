import { prisma } from '@/lib/db'

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    try {
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        })
        return count
    } catch (error) {
        console.error('Error getting notification count:', error)
        return 0
    }
}
