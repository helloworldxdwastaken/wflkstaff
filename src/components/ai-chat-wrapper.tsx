'use client'

import { usePathname } from 'next/navigation'
import { AIChat } from './ai-chat'

export function AIChatWrapper() {
    const pathname = usePathname()

    // Only show on authenticated pages (not login, not root redirect)
    const showChat = pathname !== '/login' && pathname !== '/'

    if (!showChat) return null

    return <AIChat />
}
