'use client'

import { useState } from 'react'
import { createInfoItem, deleteInfoItem, updateInfoItem } from '@/lib/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Lock, FileText, Link as LinkIcon, Plus, Trash2, Copy, ExternalLink, MoreVertical, Pencil } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <Button disabled={pending} type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            {pending ? 'Saving...' : label}
        </Button>
    )
}

export function ResourcesManager({ items, userId }: { items: any[], userId: string }) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    async function handleAdd(formData: FormData) {
        setIsAddOpen(false)
        await createInfoItem(null, formData)
    }

    async function handleEdit(formData: FormData) {
        setEditingItem(null)
        await updateInfoItem(null, formData)
    }

    async function handleDelete(id: string) {
        if (confirm("Delete this resource?")) {
            await deleteInfoItem(id)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert("Copied to clipboard!")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-400" /> Team Resources
                </h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none">
                            <Plus className="h-4 w-4 mr-2" /> Add Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Add New Resource</DialogTitle>
                        </DialogHeader>
                        <form action={handleAdd} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-slate-200">Title</Label>
                                <Input id="title" name="title" placeholder="e.g. WiFi Password" required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-slate-200">Description (Optional)</Label>
                                <Input id="description" name="description" placeholder="Briefly explain what this is for" className="bg-slate-800/50 border-slate-700 text-slate-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-slate-200">Type</Label>
                                <select id="type" name="type" className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
                                    <option value="LINK">Link</option>
                                    <option value="SECRET">Secret (Password/Key)</option>
                                    <option value="FILE">File Reference</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content" className="text-slate-200">Content / URL</Label>
                                <Input id="content" name="content" placeholder="https://... or my-secret-password" required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                            </div>
                            <DialogFooter>
                                <SubmitButton label="Add Resource" />
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Edit Resource</DialogTitle>
                        </DialogHeader>
                        {editingItem && (
                            <form action={handleEdit} className="space-y-4 mt-4">
                                <input type="hidden" name="itemId" value={editingItem.id} />
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title" className="text-slate-200">Title</Label>
                                    <Input id="edit-title" name="title" defaultValue={editingItem.title} required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description" className="text-slate-200">Description (Optional)</Label>
                                    <Input id="edit-description" name="description" defaultValue={editingItem.description || ''} className="bg-slate-800/50 border-slate-700 text-slate-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type" className="text-slate-200">Type</Label>
                                    <select id="edit-type" name="type" defaultValue={editingItem.type} className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
                                        <option value="LINK">Link</option>
                                        <option value="SECRET">Secret (Password/Key)</option>
                                        <option value="FILE">File Reference</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-content" className="text-slate-200">Content / URL</Label>
                                    <Input id="edit-content" name="content" defaultValue={editingItem.content} required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                                </div>
                                <DialogFooter>
                                    <SubmitButton label="Save Changes" />
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.length === 0 && (
                    <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-lg text-slate-500">
                        No resources have been added yet.
                    </div>
                )}
                {items.map((item) => (
                    <Card key={item.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
                        <CardHeader className="pb-3 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        {item.type === 'SECRET' && <Lock className="h-5 w-5 text-amber-500" />}
                                        {item.type === 'LINK' && <LinkIcon className="h-5 w-5 text-blue-400" />}
                                        {item.type === 'FILE' && <FileText className="h-5 w-5 text-emerald-400" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-slate-200 leading-tight">{item.title}</CardTitle>
                                        {item.description && <CardDescription className="text-slate-400 text-xs mt-1">{item.description}</CardDescription>}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-300 -mt-1 -mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-800" onClick={() => setEditingItem(item)}>
                                            <Pencil className="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="bg-slate-950/50 rounded p-2.5 flex items-center justify-between group/input border border-slate-800/50">
                                <code className="text-xs text-slate-400 font-mono truncate max-w-[180px]">
                                    {item.type === 'SECRET' ? '••••••••••••' : item.content}
                                </code>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-500 hover:text-indigo-400"
                                        onClick={() => copyToClipboard(item.content)}
                                        title="Copy"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    {item.type === 'LINK' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-500 hover:text-blue-400"
                                            onClick={() => window.open(item.content, '_blank')}
                                            title="Open Link"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
