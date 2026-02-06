'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

function parseTableRow(line: string): string[] {
    const cells: string[] = []
    const trimmed = line.trim()
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return []
    const parts = trimmed.slice(1, -1).split('|').map((p) => p.trim())
    return parts
}

function isTableSeparator(line: string): boolean {
    return /^\s*\|[\s\-:]+\|\s*$/.test(line) || /^\s*\|[\s\-|:]+\|\s*$/.test(line)
}

function formatMarkdown(text: string): string {
    if (!text?.trim()) return ''
    // Escape HTML to prevent XSS, then apply markdown
    const escape = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    let out = escape(text)
    // Bold **text** (before single * so we don't break)
    out = out.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    out = out.replace(/\*([^\*]+?)\*/g, '<em>$1</em>')
    // Inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
    // Link block: Open in new tab + Copy (escape URL for HTML attributes)
    out = out.replace(/https?:\/\/[^\s<"]+/g, (url) => {
        const href = url.replace(/&amp;/g, '&')
        const safe = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        return (
            '<span class="ai-link-wrap">' +
            '<a href="' + safe + '" target="_blank" rel="noopener noreferrer" class="ai-link">Open in new tab</a>' +
            '<button type="button" class="ai-copy-link" data-url="' + safe + '">Copy</button>' +
            '</span>'
        )
    })
    const lines = out.split('\n')
    const result: string[] = []
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        // Headings
        const h3 = /^###\s+(.+)$/.exec(line)
        const h2 = /^##\s+(.+)$/.exec(line)
        const h1 = /^#\s+(.+)$/.exec(line)
        if (h3) {
            result.push('<h3 class="ai-h3">' + h3[1] + '</h3>')
            i++
            continue
        }
        if (h2) {
            result.push('<h2 class="ai-h2">' + h2[1] + '</h2>')
            i++
            continue
        }
        if (h1) {
            result.push('<h1 class="ai-h1">' + h1[1] + '</h1>')
            i++
            continue
        }
        // Markdown table: | col1 | col2 |
        if (line.trim().startsWith('|') && line.trim().endsWith('|') && line.includes('|')) {
            const tableRows: string[][] = []
            while (i < lines.length) {
                const row = lines[i]
                if (!row.trim().startsWith('|') || !row.trim().endsWith('|')) break
                if (isTableSeparator(row)) {
                    i++
                    continue
                }
                const cells = parseTableRow(row)
                if (cells.length === 0) break
                tableRows.push(cells)
                i++
            }
            if (tableRows.length > 0) {
                const thead = tableRows[0].map((c) => '<th class="ai-th">' + c + '</th>').join('')
                const body = tableRows.slice(1).map(
                    (row) => '<tr>' + row.map((c) => '<td class="ai-td">' + c + '</td>').join('') + '</tr>'
                ).join('')
                result.push(
                    '<div class="ai-table-wrap"><table class="ai-table">' +
                    '<thead><tr>' + thead + '</tr></thead><tbody>' + body + '</tbody></table></div>'
                )
            }
            continue
        }
        // Bullet list
        const bulletMatch = /^\s*[\-\*]\s+.+$/.test(line)
        const numMatch = /^\s*\d+\.\s+.+$/.test(line)
        if (bulletMatch) {
            const items: string[] = []
            while (i < lines.length && /^\s*[\-\*]\s+.+$/.test(lines[i])) {
                items.push('<li>' + lines[i].replace(/^\s*[\-\*]\s+/, '') + '</li>')
                i++
            }
            result.push('<ul class="ai-list">' + items.join('') + '</ul>')
            continue
        }
        if (numMatch) {
            const items: string[] = []
            while (i < lines.length && /^\s*\d+\.\s+.+$/.test(lines[i])) {
                items.push('<li>' + lines[i].replace(/^\s*\d+\.\s+/, '') + '</li>')
                i++
            }
            result.push('<ol class="ai-list">' + items.join('') + '</ol>')
            continue
        }
        result.push(line)
        i++
    }
    out = result.join('\n')
    // Paragraphs and line breaks
    out = out.replace(/\n\n+/g, '</p><p class="ai-p">')
    out = out.replace(/\n/g, '<br/>')
    const trimmed = out.trim()
    if (!trimmed) return ''
    if (!trimmed.startsWith('<p') && !trimmed.startsWith('<ul') && !trimmed.startsWith('<ol') &&
        !trimmed.startsWith('<h') && !trimmed.startsWith('<div')) {
        out = '<p class="ai-p">' + out + '</p>'
    }
    return out
}

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const sendMessage = async () => {
        const trimmed = input.trim()
        if (!trimmed || loading) return

        setError(null)
        const userMessage: Message = { role: 'user', content: trimmed }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to get response')
            }

            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setMessages([])
        setError(null)
    }

    const handleMessageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const btn = (e.target as HTMLElement).closest('.ai-copy-link')
        if (!btn || !(btn instanceof HTMLElement)) return
        const url = btn.getAttribute('data-url')
        if (!url) return
        const decoded = url.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
        void navigator.clipboard.writeText(decoded).then(() => {
            const prev = btn.textContent
            btn.textContent = 'Copied!'
            btn.classList.add('ai-copy-done')
            setTimeout(() => {
                btn.textContent = prev
                btn.classList.remove('ai-copy-done')
            }, 2000)
        })
    }

    return (
        <>
            {/* Floating toggle button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-5 right-5 z-[100] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center justify-center group"
                    aria-label="Open AI Assistant"
                >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[100] w-full sm:w-[420px] h-[100dvh] sm:h-[600px] sm:max-h-[80vh] flex flex-col bg-slate-950 sm:rounded-2xl border border-slate-800 shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white leading-none">WFLK Assistant</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Powered by Groq</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                    onClick={clearChat}
                                    title="Clear chat"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                        {messages.length === 0 && !loading && (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center mb-4">
                                    <Bot className="h-8 w-8 text-indigo-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-300 mb-2">How can I help?</p>
                                <p className="text-xs text-slate-600 mb-6 max-w-[250px]">
                                    Ask me about resources, polls, analytics, DJ schedules, or anything about WFLK.
                                </p>
                                <div className="space-y-2 w-full max-w-[280px]">
                                    {[
                                        'Who is streaming this week?',
                                        'Show me our listener stats',
                                        'Where are the WFLK guidelines?',
                                        'Who is on our team?',
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            className="w-full text-left text-xs text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 transition-all"
                                            onClick={() => {
                                                setInput(suggestion)
                                                setTimeout(() => inputRef.current?.focus(), 50)
                                            }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-lg bg-indigo-600/15 border border-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="h-3.5 w-3.5 text-indigo-400" />
                                    </div>
                                )}
                                <div
                                    className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-slate-800/70 text-slate-200 rounded-bl-md border border-slate-700/50'
                                    }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div
                                            className="ai-message-content break-words break-all text-slate-200 text-sm leading-relaxed [&_strong]:font-bold [&_strong]:text-white [&_em]:italic [&_em]:text-slate-300 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-slate-700/80 [&_code]:text-indigo-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:break-all [&_.ai-link-wrap]:inline-flex [&_.ai-link-wrap]:flex-wrap [&_.ai-link-wrap]:items-center [&_.ai-link-wrap]:gap-2 [&_.ai-link-wrap]:my-1 [&_.ai-link]:text-indigo-400 [&_.ai-link]:underline [&_.ai-link]:hover:text-indigo-300 [&_.ai-copy-link]:text-xs [&_.ai-copy-link]:px-2 [&_.ai-copy-link]:py-1 [&_.ai-copy-link]:rounded [&_.ai-copy-link]:bg-slate-600 [&_.ai-copy-link]:text-slate-200 [&_.ai-copy-link]:border [&_.ai-copy-link]:border-slate-500 [&_.ai-copy-link]:cursor-pointer [&_.ai-copy-link]:hover:bg-slate-500 [&_.ai-copy-done]:bg-emerald-600/80 [&_.ai-copy-done]:border-emerald-500 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_.ai-p]:mb-2 [&_.ai-p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:my-0.5 [&_li]:text-slate-300 [&_.ai-h1]:text-lg [&_.ai-h1]:font-bold [&_.ai-h1]:text-white [&_.ai-h1]:mt-3 [&_.ai-h1]:mb-2 [&_.ai-h2]:text-base [&_.ai-h2]:font-bold [&_.ai-h2]:text-white [&_.ai-h2]:mt-3 [&_.ai-h2]:mb-1.5 [&_.ai-h3]:text-sm [&_.ai-h3]:font-semibold [&_.ai-h3]:text-slate-100 [&_.ai-h3]:mt-3 [&_.ai-h3]:mb-1 [&_.ai-table-wrap]:my-2 [&_.ai-table-wrap]:overflow-x-auto [&_.ai-table]:w-full [&_.ai-table]:border-collapse [&_.ai-table]:text-xs [&_.ai-th]:border [&_.ai-th]:border-slate-600 [&_.ai-th]:bg-slate-700/80 [&_.ai-th]:text-left [&_.ai-th]:text-slate-200 [&_.ai-th]:font-semibold [&_.ai-th]:px-2 [&_.ai-th]:py-1.5 [&_.ai-td]:border [&_.ai-td]:border-slate-600 [&_.ai-td]:px-2 [&_.ai-td]:py-1.5 [&_.ai-td]:text-slate-300"
                                            onClick={handleMessageClick}
                                            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                                        />
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-600/15 border border-indigo-600/20 flex items-center justify-center shrink-0">
                                    <Bot className="h-3.5 w-3.5 text-indigo-400" />
                                </div>
                                <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-center">
                                <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2 inline-block">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="shrink-0 border-t border-slate-800 bg-slate-900/50 p-3">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything about WFLK..."
                                rows={1}
                                className="flex-1 resize-none bg-slate-800/50 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 max-h-24 scrollbar-thin"
                                style={{ minHeight: '40px' }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement
                                    target.style.height = '40px'
                                    target.style.height = Math.min(target.scrollHeight, 96) + 'px'
                                }}
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                size="icon"
                                className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:bg-slate-800 shrink-0"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
